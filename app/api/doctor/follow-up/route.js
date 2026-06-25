import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import crypto from 'crypto';
import { notify, patientUserId } from '@/lib/notify';

// OLD-2 / ITS-39 — Bác sĩ tạo lịch hẹn tái khám cho bệnh nhân (lịch mới gắn lich_goc_id).
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['DOCTOR', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { appointmentId, slotId, note } = await req.json();
  const origin = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!origin) return NextResponse.json({ error: 'Không tìm thấy lượt khám gốc' }, { status: 404 });
  try {
    const appt = await prisma.$transaction(async (tx) => {
      const slot = await tx.scheduleSlot.findUnique({ where: { id: slotId } });
      if (!slot || !slot.available || slot.doctorId !== origin.doctorId) throw new Error('SLOT');
      const sd = new Date(slot.date); const [h, m] = slot.startTime.split(':').map(Number);
      if (new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), h, m) <= new Date()) throw new Error('PAST');
      const stale = await tx.appointment.findUnique({ where: { slotId } });
      if (stale) { if (stale.status === 'CANCELLED') await tx.appointment.delete({ where: { id: stale.id } }); else throw new Error('SLOT'); }
      await tx.scheduleSlot.update({ where: { id: slotId }, data: { available: false } });
      const code = 'CBMS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));
      return tx.appointment.create({
        data: {
          code, patientId: origin.patientId, doctorId: origin.doctorId, slotId,
          note: note || 'Tái khám', status: 'CONFIRMED', followUpOfId: appointmentId,
          qrToken: crypto.randomBytes(8).toString('hex'),
        },
      });
    });
    const uid = await patientUserId(origin.patientId);
    await notify(uid, 'FOLLOW_UP', 'Lịch tái khám', `Bác sĩ đã hẹn bạn tái khám (mã ${appt.code}). Xem chi tiết trong Lịch hẹn của tôi.`, '/appointments');
    return NextResponse.json(appt);
  } catch (e) {
    return NextResponse.json({ error: 'Khung giờ không hợp lệ hoặc đã bị đặt' }, { status: 409 });
  }
}
