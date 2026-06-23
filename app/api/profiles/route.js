import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const FIELDS = ['fullName', 'gender', 'dob', 'phone', 'cccd', 'bhyt', 'address', 'relation', 'medicalHistory', 'allergy', 'bloodType'];
const pick = (b) => {
  const d = {};
  for (const f of FIELDS) if (b[f] !== undefined && b[f] !== '') d[f] = f === 'dob' ? new Date(b[f]) : b[f];
  return d;
};

// FN-01 — Danh sách hồ sơ (bản thân + người thân) của tài khoản.
export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid }, orderBy: { id: 'asc' } });
  return NextResponse.json(profiles);
}

export async function POST(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const body = await req.json();
  const data = pick(body);
  if (!data.fullName) return NextResponse.json({ error: 'Thiếu họ tên' }, { status: 400 });
  const p = await prisma.patient.create({ data: { userId: u.uid, ...data } });
  return NextResponse.json(p);
}
