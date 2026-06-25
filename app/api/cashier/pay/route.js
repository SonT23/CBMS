import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Thu tiền hóa đơn → PAID
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['CASHIER', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { invoiceId, method } = await req.json();
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 });
  if (inv.status === 'PAID') return NextResponse.json({ error: 'Hóa đơn đã thanh toán' }, { status: 409 });
  const eCode = 'HDDT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', method: method || 'CASH', eInvoiceCode: eCode, paidAt: new Date() },
  });
  return NextResponse.json({ ok: true, invoice: updated });
}
