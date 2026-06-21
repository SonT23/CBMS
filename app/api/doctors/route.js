import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const spec = searchParams.get('specialty');
  const doctors = await prisma.doctor.findMany({
    where: { AND: [q ? { fullName: { contains: q } } : {}, spec ? { specialty: { name: spec } } : {}] },
    include: { specialty: true },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(
    doctors.map((d) => ({ id: d.id, fullName: d.fullName, specialty: d.specialty.name, fee: d.fee, experience: d.experience, rating: d.rating }))
  );
}
