import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  const doctorId = parseInt(params.id);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slots = await prisma.scheduleSlot.findMany({
    where: { doctorId, available: true, date: { gte: startOfToday } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  // Loại tiếp các slot trong hôm nay nhưng giờ bắt đầu đã trôi qua
  const future = slots.filter((s) => {
    const d = new Date(s.date);
    if (d.toDateString() !== now.toDateString()) return true;
    const [h, m] = s.startTime.split(':').map(Number);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m) > now;
  });
  return NextResponse.json(future.map((s) => ({ id: s.id, date: s.date, startTime: s.startTime, endTime: s.endTime })));
}
