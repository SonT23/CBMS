import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Chi tiết hóa đơn cho trang thanh toán / hóa đơn điện tử. Chủ hồ sơ hoặc nhân viên thu/quản trị.
export async function GET(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const inv = await prisma.invoice.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      patient: true,
      appointment: { include: { doctor: { include: { specialty: true } }, slot: true, labOrder: { include: { items: true } }, prescription: { include: { items: true } } } },
    },
  });
  if (!inv) return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 });
  const isStaff = ['CASHIER', 'ADMIN'].includes(u.role);
  if (!isStaff) {
    const profiles = await prisma.patient.findMany({ where: { userId: u.uid } });
    if (!profiles.some((p) => p.id === inv.patientId)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json(inv);
}
