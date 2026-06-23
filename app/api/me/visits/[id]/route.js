import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// OLD-1 / ITS-7 — Chi tiết một lượt khám của chính bệnh nhân (chẩn đoán, sinh hiệu, KQ CLS, đơn thuốc, hóa đơn).
export async function GET(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const patient = await prisma.patient.findUnique({ where: { userId: u.uid } });
  if (!patient) return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
  const id = parseInt(params.id);
  const v = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: { include: { specialty: true } },
      slot: true,
      record: true,
      invoice: true,
      labOrder: { include: { items: true } },
      prescription: { include: { items: true } },
    },
  });
  if (!v) return NextResponse.json({ error: 'Không tìm thấy lượt khám' }, { status: 404 });
  // Chỉ cho xem lượt khám của chính mình (RBAC theo sở hữu)
  if (v.patientId !== patient.id) return NextResponse.json({ error: 'Không có quyền xem lượt khám này' }, { status: 403 });
  // Chỉ hiển thị khi đã có bệnh án (đã khám)
  if (!v.record) return NextResponse.json({ error: 'Lượt khám chưa hoàn tất' }, { status: 409 });
  return NextResponse.json(v);
}
