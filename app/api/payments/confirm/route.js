import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notify } from '@/lib/notify';
import crypto from 'crypto';

// FN-06 — Xác nhận thanh toán online (MÔ PHỎNG cổng VNPAY/MoMo — không dùng cổng thật).
// FN-07 — đồng thời phát hành mã hóa đơn điện tử.
export async function POST(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const { invoiceId } = await req.json();
  const inv = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });
  if (!inv) return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 });
  // Chỉ chủ tài khoản (hồ sơ thuộc về mình) được thanh toán
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid } });
  if (!profiles.some((p) => p.id === inv.patientId)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  if (inv.status === 'PAID') return NextResponse.json({ error: 'Hóa đơn đã thanh toán' }, { status: 409 });
  if (inv.status === 'REFUNDED') return NextResponse.json({ error: 'Hóa đơn đã hoàn tiền' }, { status: 409 });

  const ref = 'PAY-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const eCode = 'HDDT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));
  const updated = await prisma.invoice.update({
    where: { id: inv.id },
    data: { status: 'PAID', method: 'ONLINE', paymentRef: ref, eInvoiceCode: eCode, paidAt: new Date() },
  });
  await notify(u.uid, 'PAYMENT', 'Thanh toán thành công', `Đã thanh toán hóa đơn ${inv.code} (${inv.totalAmount.toLocaleString('vi-VN')}đ). Mã HĐĐT: ${eCode}.`, `/invoice/${inv.id}`);
  return NextResponse.json({ ok: true, invoice: updated });
}
