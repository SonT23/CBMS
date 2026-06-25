import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-1 / ITS-7 — Bệnh nhân xem lịch sử các lượt khám của mình (đã có bệnh án).
export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid } });
  if (profiles.length === 0) return NextResponse.json([]);
  const visits = await prisma.appointment.findMany({
    where: { patientId: { in: profiles.map((p) => p.id) }, record: { isNot: null } },
    include: {
      doctor: { include: { specialty: true } },
      slot: true,
      record: true,
      invoice: true,
      patient: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(visits.map((a) => ({
    id: a.id,
    code: a.code,
    date: a.slot?.date,
    startTime: a.slot?.startTime,
    profile: a.patient.fullName,
    doctor: a.doctor.fullName,
    specialty: a.doctor.specialty.name,
    diagnosis: a.record?.diagnosis || a.record?.conclusion || '',
    status: a.status,
    invoiceId: a.invoice?.id || null,
    invoiceStatus: a.invoice?.status || null,
    total: a.invoice?.totalAmount || 0,
  })));
}
