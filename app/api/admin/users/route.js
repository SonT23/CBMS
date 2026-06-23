import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, hashPassword } from '@/lib/auth';

const admin = (req) => { const u = getUser(req); return u && u.role === 'ADMIN'; };
const STAFF_ROLES = ['RECEPTIONIST', 'DOCTOR', 'LAB_TECH', 'PHARMACIST', 'CASHIER', 'ADMIN'];

export async function GET(req) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { role: { not: 'PATIENT' } },
    orderBy: { id: 'asc' },
    include: { doctor: true },
  });
  return NextResponse.json(users.map((u) => ({ id: u.id, email: u.email, role: u.role, status: u.status, doctor: u.doctor?.fullName || null })));
}

export async function POST(req) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { email, role, password } = await req.json();
  if (!email || !role || !password) return NextResponse.json({ error: 'Thiếu email/vai trò/mật khẩu' }, { status: 400 });
  if (!STAFF_ROLES.includes(role)) return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 409 });
  const u = await prisma.user.create({ data: { email, role, status: 'ACTIVE', passwordHash: hashPassword(password) } });
  return NextResponse.json({ id: u.id, email: u.email, role: u.role });
}
