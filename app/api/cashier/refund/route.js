import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-3 / ITS-68 — Hoàn tiền hóa đơn đã thanh toán.
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['CASHIER', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { invoiceId, reason } = await req.json();
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 });
  if (inv.status !== 'PAID') return NextResponse.json({ error: 'Chỉ hoàn được hóa đơn đã thanh toán' }, { status: 409 });
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'REFUNDED', refundedAt: new Date(), refundReason: reason || 'Hoàn theo yêu cầu' },
  });
  return NextResponse.json({ ok: true, invoice: updated });
}
