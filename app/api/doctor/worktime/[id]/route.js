import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function DELETE(req, { params }) {
  const u = getUser(req);
  if (!u || u.role !== 'DOCTOR') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doc = await prisma.doctor.findUnique({ where: { userId: u.uid } });
  const shift = await prisma.workShift.findUnique({ where: { id: parseInt(params.id) } });
  if (!shift || shift.doctorId !== doc?.id) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  await prisma.workShift.delete({ where: { id: shift.id } });
  return NextResponse.json({ ok: true });
}
