import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Hàng chờ đơn thuốc + tồn kho cho dược sĩ
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['PHARMACIST', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const pending = await prisma.prescription.findMany({
    where: { status: { notIn: ['DISPENSED', 'CANCELLED'] } },
    include: { patient: true, doctor: true, items: { include: { medication: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const meds = await prisma.medication.findMany({ orderBy: { name: 'asc' } });
  const lowStock = meds.filter((m) => m.stock <= m.reorderLevel);
  return NextResponse.json({ pending, meds, lowStock });
}
