import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const items = await prisma.notification.findMany({ where: { userId: u.uid }, orderBy: { createdAt: 'desc' }, take: 50 });
  const unread = items.filter((n) => !n.isRead).length;
  return NextResponse.json({ items, unread });
}
