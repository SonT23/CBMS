import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  const id = parseInt(params.id);
  const d = await prisma.doctor.findUnique({ where: { id }, include: { specialty: true } });
  if (!d) return NextResponse.json({ error: 'Không tìm thấy bác sĩ' }, { status: 404 });
  return NextResponse.json({
    id: d.id, fullName: d.fullName, specialty: d.specialty.name,
    fee: d.fee, experience: d.experience, rating: d.rating,
  });
}
