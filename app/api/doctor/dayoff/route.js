import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(req) {
  const u = getUser(req);
  if (!u || u.role !== 'DOCTOR') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doc = await prisma.doctor.findUnique({ where: { userId: u.uid } });
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy hồ sơ bác sĩ' }, { status: 404 });
  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: 'Thiếu ngày nghỉ' }, { status: 400 });
  const d = new Date(date);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const off = await prisma.dayOff.create({ data: { doctorId: doc.id, date: day } });
  return NextResponse.json(off);
}
