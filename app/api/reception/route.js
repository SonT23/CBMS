import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Hàng chờ tiếp đón: các lịch đang hoạt động (chờ check-in + đã check-in)
export async function GET(req) {
  const u = getUser(req);
  if (!u || !['RECEPTIONIST', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const appts = await prisma.appointment.findMany({
    where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    include: { patient: true, doctor: { include: { specialty: true } }, slot: true },
    orderBy: [{ slot: { date: 'asc' } }, { slot: { startTime: 'asc' } }],
  });
  const waiting = appts.filter((a) => a.status === 'CONFIRMED');
  const queue = appts
    .filter((a) => a.status === 'CHECKED_IN')
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
  return NextResponse.json({ waiting, queue });
}
