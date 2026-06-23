import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const specs = await prisma.specialty.findMany({ orderBy: { id: 'asc' } });
  return NextResponse.json(specs.map((s) => ({ id: s.id, name: s.name })));
}
