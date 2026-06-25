import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const CANCEL_HOURS = 2;

// FN-09 — Đổi lịch (giữ nguyên lịch hẹn, chuyển sang slot mới cùng bác sĩ).
export async function PATCH(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const id = parseInt(params.id);
  const { newSlotId } = await req.json();
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { slot: true } });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy lịch hẹn' }, { status: 404 });
  if (appt.status !== 'CONFIRMED') return NextResponse.json({ error: 'Chỉ đổi được lịch chưa check-in' }, { status: 409 });
  const sd = new Date(appt.slot.date); const [h, m] = appt.slot.startTime.split(':').map(Number);
  if (new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), h, m).getTime() - Date.now() < CANCEL_HOURS * 3600000)
    return NextResponse.json({ error: `Chỉ được đổi trước giờ khám ít nhất ${CANCEL_HOURS} giờ` }, { status: 409 });
  try {
    await prisma.$transaction(async (tx) => {
      const slot = await tx.scheduleSlot.findUnique({ where: { id: Number(newSlotId) } });
      if (!slot || !slot.available || slot.doctorId !== appt.doctorId) throw new Error('SLOT');
      const nd = new Date(slot.date); const [nh, nm] = slot.startTime.split(':').map(Number);
      if (new Date(nd.getFullYear(), nd.getMonth(), nd.getDate(), nh, nm) <= new Date()) throw new Error('PAST');
      const onSlot = await tx.appointment.findUnique({ where: { slotId: Number(newSlotId) } });
      if (onSlot) { if (onSlot.status === 'CANCELLED') await tx.appointment.delete({ where: { id: onSlot.id } }); else throw new Error('SLOT'); }
      await tx.scheduleSlot.update({ where: { id: appt.slotId }, data: { available: true } }); // trả slot cũ
      await tx.scheduleSlot.update({ where: { id: Number(newSlotId) }, data: { available: false } });
      await tx.appointment.update({ where: { id }, data: { slotId: Number(newSlotId) } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Khung giờ mới không hợp lệ hoặc đã bị đặt' }, { status: 409 });
  }
}
