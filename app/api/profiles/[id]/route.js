import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const FIELDS = ['fullName', 'gender', 'dob', 'phone', 'cccd', 'bhyt', 'address', 'relation', 'medicalHistory', 'allergy', 'bloodType'];
const pick = (b) => { const d = {}; for (const f of FIELDS) if (b[f] !== undefined) d[f] = f === 'dob' ? (b[f] ? new Date(b[f]) : null) : b[f]; return d; };

async function own(u, id) { const p = await prisma.patient.findUnique({ where: { id } }); return p && p.userId === u.uid ? p : null; }

export async function PUT(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const p = await own(u, parseInt(params.id));
  if (!p) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const up = await prisma.patient.update({ where: { id: p.id }, data: pick(await req.json()) });
  return NextResponse.json(up);
}

export async function DELETE(req, { params }) {
  const u = getUser(req);
  if (!u) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const p = await own(u, parseInt(params.id));
  if (!p) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  // Không cho xóa nếu là hồ sơ duy nhất, hoặc đã có lịch khám
  const count = await prisma.patient.count({ where: { userId: u.uid } });
  if (count <= 1) return NextResponse.json({ error: 'Không thể xóa hồ sơ duy nhất' }, { status: 409 });
  try {
    await prisma.patient.delete({ where: { id: p.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Không xóa được — hồ sơ đã có lịch khám' }, { status: 409 });
  }
}
