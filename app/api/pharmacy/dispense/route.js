import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Xuất thuốc: kiểm tra tồn → trừ kho (transaction) → đơn DISPENSED.
// BR: không cho xuất quá tồn kho (chặn tồn âm).
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['PHARMACIST', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { prescriptionId } = await req.json();
  try {
    await prisma.$transaction(async (tx) => {
      const pres = await tx.prescription.findUnique({ where: { id: prescriptionId }, include: { items: { include: { medication: true } } } });
      if (!pres) throw new Error('NOT_FOUND');
      if (pres.status === 'DISPENSED') throw new Error('ALREADY');
      for (const it of pres.items) {
        if (it.medication.stock < it.quantity) throw new Error('INSUFFICIENT:' + it.medName);
      }
      for (const it of pres.items) {
        await tx.medication.update({ where: { id: it.medicationId }, data: { stock: { decrement: it.quantity } } });
      }
      await tx.prescription.update({ where: { id: prescriptionId }, data: { status: 'DISPENSED' } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const m = String(e.message || '');
    if (m.startsWith('INSUFFICIENT:')) return NextResponse.json({ error: `Không đủ tồn kho: ${m.split(':')[1]}` }, { status: 409 });
    return NextResponse.json({ error: 'Không thể xuất đơn thuốc này' }, { status: 409 });
  }
}
