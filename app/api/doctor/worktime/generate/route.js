import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// FN-05 / FR-M2-011 — Sinh khung giờ trống (ScheduleSlot) từ ca làm việc, trong N ngày tới.
export async function POST(req) {
  const u = getUser(req);
  if (!u || u.role !== 'DOCTOR') return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const doc = await prisma.doctor.findUnique({ where: { userId: u.uid } });
  if (!doc) return NextResponse.json({ error: 'Không tìm thấy hồ sơ bác sĩ' }, { status: 404 });
  const { days = 7 } = await req.json().catch(() => ({}));
  const shifts = await prisma.workShift.findMany({ where: { doctorId: doc.id } });
  if (shifts.length === 0) return NextResponse.json({ error: 'Chưa cấu hình ca làm việc' }, { status: 400 });

  const offs = await prisma.dayOff.findMany({ where: { doctorId: doc.id } });
  const offSet = new Set(offs.map((o) => new Date(o.date).toDateString()));
  const now = new Date();
  let created = 0;

  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    if (offSet.has(day.toDateString())) continue;
    const wd = day.getDay();
    for (const sh of shifts.filter((s) => s.weekday === wd)) {
      for (let m = toMin(sh.startTime); m + sh.slotMinutes <= toMin(sh.endTime); m += sh.slotMinutes) {
        const startTime = toHHMM(m);
        // bỏ qua slot quá khứ trong hôm nay
        if (d === 0 && new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60) <= now) continue;
        // tránh trùng slot đã có
        const exists = await prisma.scheduleSlot.findFirst({
          where: { doctorId: doc.id, date: day, startTime },
        });
        if (exists) continue;
        await prisma.scheduleSlot.create({ data: { doctorId: doc.id, date: day, startTime, endTime: toHHMM(m + sh.slotMinutes), available: true } });
        created++;
      }
    }
  }
  return NextResponse.json({ ok: true, created });
}
