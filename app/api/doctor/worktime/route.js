import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

async function myDoctor(u) { return prisma.doctor.findUnique({ where: { userId: u.uid } }); }

// FN-05 — Lịch làm việc của bác sĩ đang đăng nhập: ca làm việc + ngày nghỉ.
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['DOCTOR', 'ADMIN'].includes(u.role)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doc = await myDoctor(u);
  if (!doc) return NextResponse.json({ doctor: null, shifts: [], daysOff: [] });
  const shifts = await prisma.workShift.findMany({ where: { doctorId: doc.id }, orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] });
  const daysOff = await prisma.dayOff.findMany({ where: { doctorId: doc.id, date: { gte: new Date(new Date().toDateString()) } }, orderBy: { date: 'asc' } });
  return NextResponse.json({ doctor: { id: doc.id, fullName: doc.fullName }, shifts, daysOff });
}

export async function POST(req) {
  const u = getUser(req);
  if (!u || u.role !== 'DOCTOR') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doc = await myDoctor(u);
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy hồ sơ bác sĩ' }, { status: 404 });
  const { weekday, startTime, endTime, slotMinutes } = await req.json();
  if (weekday === undefined || !startTime || !endTime) return NextResponse.json({ error: 'Thiếu thông tin ca' }, { status: 400 });
  const s = await prisma.workShift.create({ data: { doctorId: doc.id, weekday: Number(weekday), startTime, endTime, slotMinutes: Number(slotMinutes) || 30 } });
  return NextResponse.json(s);
}
