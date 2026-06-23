import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-6 / ITS-31 — Lễ tân check-in bằng mã QR (qrToken).
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['RECEPTIONIST', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { qrToken } = await req.json();
  if (!qrToken) return NextResponse.json({ error: 'Thiếu mã QR' }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({ where: { qrToken: qrToken.trim() }, include: { patient: true } });
      if (!appt) throw new Error('NOT_FOUND');
      if (appt.status !== 'CONFIRMED') throw new Error('BAD_STATE');
      const agg = await tx.appointment.aggregate({ where: { doctorId: appt.doctorId, queueNumber: { not: null } }, _max: { queueNumber: true } });
      const next = (agg._max.queueNumber || 0) + 1;
      const up = await tx.appointment.update({ where: { id: appt.id }, data: { status: 'CHECKED_IN', queueNumber: next, checkedInAt: new Date() } });
      return { queueNumber: up.queueNumber, patient: appt.patient.fullName };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const m = String(e.message);
    if (m.includes('NOT_FOUND')) return NextResponse.json({ error: 'Mã QR không hợp lệ' }, { status: 404 });
    return NextResponse.json({ error: 'Lịch hẹn không ở trạng thái chờ tiếp đón' }, { status: 409 });
  }
}
