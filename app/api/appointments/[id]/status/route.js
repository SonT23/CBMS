import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const CANCEL_HOURS = 2; // FN-09: chính sách hủy — phải hủy trước N giờ

export async function PATCH(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const id = parseInt(params.id);
  const { status } = await req.json();
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { slot: true, invoice: true } });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy lịch hẹn' }, { status: 404 });

  if (status === 'CANCELLED') {
    if (appt.status !== 'CONFIRMED')
      return NextResponse.json({ error: 'Chỉ hủy được lịch chưa check-in' }, { status: 409 });
    // Kiểm tra chính sách thời gian
    const sd = new Date(appt.slot.date); const [h, m] = appt.slot.startTime.split(':').map(Number);
    const start = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), h, m);
    if (start.getTime() - Date.now() < CANCEL_HOURS * 3600000)
      return NextResponse.json({ error: `Chỉ được hủy trước giờ khám ít nhất ${CANCEL_HOURS} giờ` }, { status: 409 });
    // Hoàn phí nếu đã thanh toán
    const refunded = appt.invoice && appt.invoice.status === 'PAID';
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
      await tx.scheduleSlot.update({ where: { id: appt.slotId }, data: { available: true } });
      if (refunded) await tx.invoice.update({ where: { id: appt.invoice.id }, data: { status: 'REFUNDED', refundedAt: new Date(), refundReason: 'Hủy lịch hẹn' } });
    });
    return NextResponse.json({ ok: true, refunded: !!refunded });
  }
  await prisma.appointment.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
