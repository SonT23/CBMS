import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: u.uid }, include: { patients: { orderBy: { id: 'asc' } } } });
  if (!user) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  const ids = user.patients.map((p) => p.id);
  const total = ids.length ? await prisma.appointment.count({ where: { patientId: { in: ids } } }) : 0;
  const upcoming = ids.length ? await prisma.appointment.count({ where: { patientId: { in: ids }, status: 'CONFIRMED' } }) : 0;
  const self = user.patients[0];
  return NextResponse.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    fullName: self?.fullName || '',
    gender: self?.gender || null,
    profileCount: user.patients.length,
    stats: { total, upcoming, cancelled: total - upcoming },
  });
}
