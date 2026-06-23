import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const guard = (u) => u && ['PHARMACIST', 'ADMIN'].includes(u.role);

export async function GET(req) {
  if (!guard(getUser(req))) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  return NextResponse.json(await prisma.supplier.findMany({ orderBy: { id: 'asc' } }));
}

export async function POST(req) {
  if (!guard(getUser(req))) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { name, phone, contact } = await req.json();
  if (!name) return NextResponse.json({ error: 'Thiếu tên nhà cung cấp' }, { status: 400 });
  const s = await prisma.supplier.create({ data: { name, phone: phone || null, contact: contact || null } });
  return NextResponse.json(s);
}
