import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: u.uid }, include: { patient: true } });
  if (!user) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  const patientId = user.patient?.id;
  const total = patientId ? await prisma.appointment.count({ where: { patientId } }) : 0;
  const upcoming = patientId
    ? await prisma.appointment.count({ where: { patientId, status: 'CONFIRMED' } })
    : 0;
  return NextResponse.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    fullName: user.patient?.fullName || '',
    gender: user.patient?.gender || null,
    stats: { total, upcoming, cancelled: total - upcoming },
  });
}
