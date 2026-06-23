import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-5 — Chi tiết đơn thuốc (để in tem hướng dẫn sử dụng).
export async function GET(req, { params }) {
  const u = getUser(req);
  if (!u || !['PHARMACIST', 'ADMIN', 'DOCTOR'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const p = await prisma.prescription.findUnique({
    where: { id: parseInt(params.id) },
    include: { patient: true, doctor: true, items: { include: { medication: true } } },
  });
  if (!p) return NextResponse.json({ error: 'Không tìm thấy đơn thuốc' }, { status: 404 });
  return NextResponse.json(p);
}
