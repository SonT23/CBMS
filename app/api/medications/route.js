import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  if (!getUser(req)) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const meds = await prisma.medication.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(meds);
}
