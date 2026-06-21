import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const id = parseInt(params.id);
  const { status } = await req.json();
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy lịch hẹn' }, { status: 404 });
  if (status === 'CANCELLED') {
    await prisma.$transaction([
      prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } }),
      prisma.scheduleSlot.update({ where: { id: appt.slotId }, data: { available: true } }),
    ]);
  } else {
    await prisma.appointment.update({ where: { id }, data: { status } });
  }
  return NextResponse.json({ ok: true });
}
