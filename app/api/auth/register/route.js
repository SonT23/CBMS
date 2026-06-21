import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req) {
  const { email, phone, password, fullName } = await req.json();
  if (!email || !password || !fullName)
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (exists) return NextResponse.json({ error: 'Email hoặc SĐT đã tồn tại' }, { status: 409 });
  const user = await prisma.user.create({
    data: { email, phone: phone || null, passwordHash: hashPassword(password), role: 'PATIENT', patient: { create: { fullName } } },
    include: { patient: true },
  });
  const token = signToken({ uid: user.id, email, role: 'PATIENT' });
  return NextResponse.json({ token, user: { id: user.id, email, fullName } });
}
