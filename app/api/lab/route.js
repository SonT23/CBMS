import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Hàng chờ phiếu CLS cho KTV (chưa gửi bác sĩ)
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['LAB_TECH', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const orders = await prisma.labOrder.findMany({
    where: { status: { not: 'SENT_DOCTOR' } },
    include: { patient: true, doctor: true, items: { include: { labTest: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(orders);
}
