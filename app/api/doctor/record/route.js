import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const genCode = (p) => p + '-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));

// Lưu bệnh án (sinh hiệu + chẩn đoán + chỉ định CLS + đơn thuốc).
// complete=true → hoàn tất khám + tạo hóa đơn (gộp phí khám + CLS + thuốc).
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['DOCTOR', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const body = await req.json();
  const { appointmentId, complete, labTestIds = [], prescriptionItems = [] } = body;
  if (!appointmentId || Number.isNaN(Number(appointmentId)))
    return NextResponse.json({ error: 'Thiếu hoặc sai appointmentId' }, { status: 400 });

  const appt = await prisma.appointment.findUnique({ where: { id: Number(appointmentId) }, include: { doctor: true } });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy lịch khám' }, { status: 404 });

  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const data = {
    bloodPressure: body.bloodPressure || null,
    temperature: num(body.temperature),
    heartRate: num(body.heartRate),
    weight: num(body.weight),
    height: num(body.height),
    spo2: num(body.spo2),
    bmi: body.weight && body.height ? +(Number(body.weight) / Math.pow(Number(body.height) / 100, 2)).toFixed(1) : null,
    symptoms: body.symptoms || null,
    diagnosis: body.diagnosis || null,
    conclusion: body.conclusion || null,
    advice: body.advice || null,
    status: complete ? 'COMPLETED' : 'IN_PROGRESS',
  };

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.upsert({
      where: { appointmentId },
      update: data,
      create: { appointmentId, patientId: appt.patientId, doctorId: appt.doctorId, ...data },
    });

    // ----- Chỉ định CLS (M5) -----
    let labFee = 0;
    const existingLab = await tx.labOrder.findUnique({ where: { appointmentId } });
    if (labTestIds.length > 0) {
      const tests = await tx.labTest.findMany({ where: { id: { in: labTestIds } } });
      labFee = tests.reduce((s, t) => s + t.price, 0);
      const lo = existingLab
        ? (await tx.labOrderItem.deleteMany({ where: { labOrderId: existingLab.id } }), existingLab)
        : await tx.labOrder.create({ data: { code: genCode('CLS'), appointmentId, patientId: appt.patientId, doctorId: appt.doctorId, status: 'NEW' } });
      await tx.labOrderItem.createMany({ data: tests.map((t) => ({ labOrderId: lo.id, labTestId: t.id, testName: t.name, price: t.price })) });
    } else if (existingLab) {
      await tx.labOrderItem.deleteMany({ where: { labOrderId: existingLab.id } });
      await tx.labOrder.delete({ where: { id: existingLab.id } });
    }

    // ----- Kê đơn thuốc (M6) -----
    let medFee = 0;
    const cleanItems = (prescriptionItems || []).filter((it) => it.medicationId && Number(it.quantity) > 0);
    const existingPres = await tx.prescription.findUnique({ where: { appointmentId } });
    if (cleanItems.length > 0) {
      const meds = await tx.medication.findMany({ where: { id: { in: cleanItems.map((i) => Number(i.medicationId)) } } });
      const medMap = Object.fromEntries(meds.map((m) => [m.id, m]));
      const pr = existingPres
        ? (await tx.prescriptionItem.deleteMany({ where: { prescriptionId: existingPres.id } }), existingPres)
        : await tx.prescription.create({ data: { code: genCode('DT'), appointmentId, patientId: appt.patientId, doctorId: appt.doctorId, status: 'NEW' } });
      const rows = cleanItems.map((it) => {
        const m = medMap[Number(it.medicationId)];
        medFee += (m?.price || 0) * Number(it.quantity);
        return { prescriptionId: pr.id, medicationId: m.id, medName: m.name, quantity: Number(it.quantity), dosage: it.dosage || null, price: m.price };
      });
      await tx.prescriptionItem.createMany({ data: rows });
    } else if (existingPres) {
      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: existingPres.id } });
      await tx.prescription.delete({ where: { id: existingPres.id } });
    }

    if (!complete && appt.status === 'CHECKED_IN') {
      await tx.appointment.update({ where: { id: appointmentId }, data: { status: 'IN_PROGRESS' } });
    }

    let invoice = null;
    if (complete) {
      await tx.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED' } });
      const examFee = appt.doctor.fee || 0;
      const total = examFee + labFee + medFee;
      invoice = await tx.invoice.upsert({
        where: { appointmentId },
        update: { examFee, labFee, medFee, totalAmount: total },
        create: { code: genCode('HD'), appointmentId, patientId: appt.patientId, examFee, labFee, medFee, totalAmount: total, status: 'PENDING_PAYMENT' },
      });
    }
    return { record, invoice };
  });
  return NextResponse.json({ ok: true, ...result });
}
