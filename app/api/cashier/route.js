import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Danh sách hóa đơn: chờ thu + đã thu (gần đây)
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['CASHIER', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const include = {
    patient: true,
    appointment: { include: { doctor: { include: { specialty: true } }, record: true, slot: true } },
  };
  const pending = await prisma.invoice.findMany({
    where: { status: 'PENDING_PAYMENT' },
    include,
    orderBy: { createdAt: 'asc' },
  });
  const paid = await prisma.invoice.findMany({
    where: { status: 'PAID' },
    include,
    orderBy: { paidAt: 'desc' },
    take: 10,
  });
  const todayRevenue = paid
    .filter((i) => i.paidAt && new Date(i.paidAt).toDateString() === new Date().toDateString())
    .reduce((s, i) => s + i.totalAmount, 0);
  return NextResponse.json({ pending, paid, todayRevenue });
}
