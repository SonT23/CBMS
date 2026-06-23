import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Hàng chờ của bác sĩ đang đăng nhập: các bệnh nhân đã check-in / đang khám
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['DOCTOR', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doctor = await prisma.doctor.findUnique({ where: { userId: u.uid } });
  if (!doctor) return NextResponse.json({ doctor: null, queue: [] });
  const appts = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, status: { in: ['CHECKED_IN', 'IN_PROGRESS'] } },
    include: { patient: true, slot: true, record: true },
    orderBy: [{ queueNumber: 'asc' }],
  });
  return NextResponse.json({
    doctor: { id: doctor.id, fullName: doctor.fullName, fee: doctor.fee },
    queue: appts,
  });
}
