import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { RESOURCES } from '@/lib/adminResources';

const admin = (req) => { const u = getUser(req); return u && u.role === 'ADMIN'; };
const pick = (cfg, body) => {
  const d = {};
  for (const f of cfg.fields) if (body[f] !== undefined && body[f] !== '') d[f] = cfg.num.includes(f) ? Number(body[f]) : body[f];
  return d;
};

export async function PUT(req, { params }) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const cfg = RESOURCES[params.resource];
  if (!cfg) return NextResponse.json({ error: 'Tài nguyên không hợp lệ' }, { status: 404 });
  const row = await prisma[cfg.model].update({ where: { id: parseInt(params.id) }, data: pick(cfg, await req.json()) });
  return NextResponse.json(row);
}

export async function DELETE(req, { params }) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const cfg = RESOURCES[params.resource];
  if (!cfg) return NextResponse.json({ error: 'Tài nguyên không hợp lệ' }, { status: 404 });
  try {
    await prisma[cfg.model].delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Không xóa được — mục đang được sử dụng bởi dữ liệu khác' }, { status: 409 });
  }
}
