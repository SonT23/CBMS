import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email }, include: { patients: { orderBy: { id: 'asc' }, take: 1 } } });
  if (!user || !verifyPassword(password, user.passwordHash))
    return NextResponse.json({ error: 'Sai email hoặc mật khẩu' }, { status: 401 });
  if (user.status === 'LOCKED')
    return NextResponse.json({ error: 'Tài khoản đã bị khóa, liên hệ quản trị viên' }, { status: 403 });
  const token = signToken({ uid: user.id, email, role: user.role });
  return NextResponse.json({ token, user: { id: user.id, email, role: user.role, fullName: user.patients[0]?.fullName || '' } });
}
