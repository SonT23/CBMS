import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const n = await prisma.notification.findUnique({ where: { id: parseInt(params.id) } });
  if (!n || n.userId !== u.uid) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  await prisma.notification.update({ where: { id: n.id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
