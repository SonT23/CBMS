import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const STAFF_ROLES = ['RECEPTIONIST', 'DOCTOR', 'LAB_TECH', 'PHARMACIST', 'CASHIER', 'ADMIN'];

// PATCH — đổi vai trò hoặc khóa/mở tài khoản nhân viên.
export async function PATCH(req, { params }) {
  const me = getUser(req);
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = parseInt(params.id);
  if (id === me.uid) return NextResponse.json({ error: 'Không thể tự đổi quyền/khóa chính mình' }, { status: 409 });
  const { role, status } = await req.json();
  const data = {};
  if (role) { if (!STAFF_ROLES.includes(role)) return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 }); data.role = role; }
  if (status) data.status = status; // ACTIVE | LOCKED
  const u = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: u.id, role: u.role, status: u.status });
}
