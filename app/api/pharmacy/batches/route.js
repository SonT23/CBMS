import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const guard = (u) => u && ['PHARMACIST', 'ADMIN'].includes(u.role);

// OLD-7 / ITS-45 — Quản lý lô thuốc & nhà cung cấp.
export async function GET(req) {
  if (!guard(getUser(req))) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const batches = await prisma.medicationBatch.findMany({
    include: { medication: true, supplier: true },
    orderBy: [{ expiry: 'asc' }],
  });
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86400000); // 30 ngày
  return NextResponse.json(batches.map((b) => ({
    id: b.id, medication: b.medication.name, supplier: b.supplier?.name || '—',
    batchNo: b.batchNo, quantity: b.quantity, expiry: b.expiry, status: b.status,
    expired: new Date(b.expiry) < now,
    nearExpiry: new Date(b.expiry) >= now && new Date(b.expiry) <= soon,
  })));
}

// Thêm lô mới → cộng tồn kho thuốc (transaction).
export async function POST(req) {
  if (!guard(getUser(req))) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { medicationId, supplierId, batchNo, quantity, expiry } = await req.json();
  if (!medicationId || !batchNo || !quantity || !expiry)
    return NextResponse.json({ error: 'Thiếu thông tin lô thuốc' }, { status: 400 });
  const qty = Number(quantity);
  const batch = await prisma.$transaction(async (tx) => {
    const b = await tx.medicationBatch.create({
      data: {
        medicationId: Number(medicationId), supplierId: supplierId ? Number(supplierId) : null,
        batchNo, quantity: qty, expiry: new Date(expiry), status: 'IN_STOCK',
      },
    });
    await tx.medication.update({ where: { id: Number(medicationId) }, data: { stock: { increment: qty } } });
    return b;
  });
  return NextResponse.json({ ok: true, batch });
}
