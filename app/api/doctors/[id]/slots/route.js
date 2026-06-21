import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  const doctorId = parseInt(params.id);
  const slots = await prisma.scheduleSlot.findMany({
    where: { doctorId, available: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return NextResponse.json(slots.map((s) => ({ id: s.id, date: s.date, startTime: s.startTime, endTime: s.endTime })));
}
