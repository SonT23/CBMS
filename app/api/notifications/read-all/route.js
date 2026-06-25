import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: u.uid, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
