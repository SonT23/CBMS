import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  // Đa hồ sơ: lấy lịch của TẤT CẢ hồ sơ thuộc tài khoản
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid } });
  if (profiles.length === 0) return NextResponse.json([]);
  const appts = await prisma.appointment.findMany({
    where: { patientId: { in: profiles.map((p) => p.id) } },
    include: { doctor: { include: { specialty: true } }, slot: true, patient: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(appts);
}

export async function POST(req) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const { doctorId, slotId, note, profileId } = await req.json();
  // Chọn hồ sơ đi khám (đặt hộ): mặc định là hồ sơ đầu tiên (bản thân) nếu không chỉ định
  const profiles = await prisma.patient.findMany({ where: { userId: u.uid }, orderBy: { id: 'asc' } });
  if (profiles.length === 0) return NextResponse.json({ error: 'Không tìm thấy hồ sơ bệnh nhân' }, { status: 400 });
  const patient = profileId ? profiles.find((p) => p.id === Number(profileId)) : profiles[0];
  if (!patient) return NextResponse.json({ error: 'Hồ sơ không hợp lệ' }, { status: 400 });
  try {
    const appt = await prisma.$transaction(async (tx) => {
      const slot = await tx.scheduleSlot.findUnique({ where: { id: slotId } });
      if (!slot || !slot.available || slot.doctorId !== doctorId) throw new Error('SLOT_TAKEN');
      const sd = new Date(slot.date);
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const slotStart = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), sh, sm);
      if (slotStart <= new Date()) throw new Error('SLOT_PAST');
      // Dọn lịch CŨ đã hủy còn chiếm slot này (cột slotId là UNIQUE) để cho phép đặt lại;
      // lịch chưa hủy mà chiếm slot => thực sự đã có người đặt.
      const stale = await tx.appointment.findUnique({ where: { slotId } });
      if (stale) {
        if (stale.status === 'CANCELLED') await tx.appointment.delete({ where: { id: stale.id } });
        else throw new Error('SLOT_TAKEN');
      }
      await tx.scheduleSlot.update({ where: { id: slotId }, data: { available: false } });
      const code = 'CBMS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(1000 + Math.random() * 9000));
      const qrToken = require('crypto').randomBytes(8).toString('hex');
      return tx.appointment.create({ data: { code, patientId: patient.id, doctorId, slotId, note: note || null, status: 'CONFIRMED', qrToken } });
    });
    return NextResponse.json(appt);
  } catch (e) {
    return NextResponse.json({ error: 'Khung giờ vừa bị đặt hoặc không hợp lệ' }, { status: 409 });
  }
}
