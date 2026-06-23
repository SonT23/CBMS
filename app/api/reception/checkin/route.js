import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Check-in bệnh nhân: cấp số thứ tự, chuyển trạng thái CHECKED_IN
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['RECEPTIONIST', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { appointmentId } = await req.json();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!appt) throw new Error('NOT_FOUND');
      if (appt.status !== 'CONFIRMED') throw new Error('BAD_STATE');
      // STT kế tiếp trong ngày của cùng bác sĩ
      const agg = await tx.appointment.aggregate({
        where: { doctorId: appt.doctorId, queueNumber: { not: null } },
        _max: { queueNumber: true },
      });
      const next = (agg._max.queueNumber || 0) + 1;
      return tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CHECKED_IN', queueNumber: next, checkedInAt: new Date() },
      });
    });
    return NextResponse.json({ ok: true, queueNumber: result.queueNumber });
  } catch (e) {
    return NextResponse.json({ error: 'Không thể check-in lịch hẹn này' }, { status: 409 });
  }
}
