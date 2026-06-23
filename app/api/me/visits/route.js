import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-1 / ITS-7 — Bệnh nhân xem lịch sử các lượt khám của mình (đã có bệnh án).
export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const patient = await prisma.patient.findUnique({ where: { userId: u.uid } });
  if (!patient) return NextResponse.json([]);
  const visits = await prisma.appointment.findMany({
    where: { patientId: patient.id, record: { isNot: null } },
    include: {
      doctor: { include: { specialty: true } },
      slot: true,
      record: true,
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(visits.map((a) => ({
    id: a.id,
    code: a.code,
    date: a.slot?.date,
    startTime: a.slot?.startTime,
    doctor: a.doctor.fullName,
    specialty: a.doctor.specialty.name,
    diagnosis: a.record?.diagnosis || a.record?.conclusion || '',
    status: a.status,
    invoiceStatus: a.invoice?.status || null,
    total: a.invoice?.totalAmount || 0,
  })));
}
