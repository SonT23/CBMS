import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import QRCode from 'qrcode';

// OLD-6 — Phiếu khám điện tử: trả thông tin + ảnh QR (data URL) của lịch hẹn.
export async function GET(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid } });
  const appt = await prisma.appointment.findUnique({
    where: { id: parseInt(params.id) },
    include: { doctor: { include: { specialty: true } }, slot: true, patient: true },
  });
  if (!appt) return NextResponse.json({ error: 'Không tìm thấy lịch hẹn' }, { status: 404 });
  if (!profiles.some((p) => p.id === appt.patientId)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const qrDataUrl = appt.qrToken ? await QRCode.toDataURL(appt.qrToken, { margin: 1, width: 240 }) : null;
  return NextResponse.json({
    code: appt.code, qrToken: appt.qrToken, qrDataUrl,
    patient: appt.patient.fullName, doctor: appt.doctor.fullName, specialty: appt.doctor.specialty.name,
    date: appt.slot?.date, startTime: appt.slot?.startTime, status: appt.status, note: appt.note,
  });
}
