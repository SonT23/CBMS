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

export async function GET(req, { params }) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const cfg = RESOURCES[params.resource];
  if (!cfg) return NextResponse.json({ error: 'Tài nguyên không hợp lệ' }, { status: 404 });
  const rows = await prisma[cfg.model].findMany({ orderBy: { id: 'asc' }, include: cfg.include });
  return NextResponse.json(rows);
}

export async function POST(req, { params }) {
  if (!admin(req)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const cfg = RESOURCES[params.resource];
  if (!cfg) return NextResponse.json({ error: 'Tài nguyên không hợp lệ' }, { status: 404 });
  const body = await req.json();
  const data = pick(cfg, body);
  if (!data[cfg.fields[0]]) return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  const row = await prisma[cfg.model].create({ data });
  return NextResponse.json(row);
}
