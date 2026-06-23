import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Lấy bệnh án + ngữ cảnh của một lịch khám (cho bác sĩ)
export async function GET(req, { params }) {
  const u = getUser(req);
  if (!u || !['DOCTOR', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const appointmentId = parseInt(params.appointmentId);
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true, doctor: true, slot: true, record: true,
      labOrder: { include: { items: true } },
      prescription: { include: { items: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  // Lịch sử khám trước đó của bệnh nhân (đã hoàn tất)
  const history = await prisma.medicalRecord.findMany({
    where: { patientId: appt.patientId, appointmentId: { not: appointmentId } },
    include: { doctor: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return NextResponse.json({ appt, history });
}
