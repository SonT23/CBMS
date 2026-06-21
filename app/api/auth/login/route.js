import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email }, include: { patient: true } });
  if (!user || !verifyPassword(password, user.passwordHash))
    return NextResponse.json({ error: 'Sai email hoặc mật khẩu' }, { status: 401 });
  const token = signToken({ uid: user.id, email, role: user.role });
  return NextResponse.json({ token, user: { id: user.id, email, fullName: user.patient?.fullName || '' } });
}
