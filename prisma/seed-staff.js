// Seed tài khoản nhân viên theo vai trò + link bác sĩ với tài khoản đăng nhập.
// Chạy: node prisma/seed-staff.js   (idempotent — bỏ qua nếu đã tồn tại)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const PASS = 'Abc@1234';

async function upsertUser(email, role) {
  const hash = bcrypt.hashSync(PASS, 10);
  return prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, passwordHash: hash, role, status: 'ACTIVE' },
  });
}

async function main() {
  // Nhân viên cố định
  await upsertUser('letan@cbms.vn', 'RECEPTIONIST');
  await upsertUser('thungan@cbms.vn', 'CASHIER');
  await upsertUser('admin@cbms.vn', 'ADMIN');

  // Mỗi bác sĩ một tài khoản đăng nhập, link userId
  const doctors = await prisma.doctor.findMany({ orderBy: { id: 'asc' } });
  for (const d of doctors) {
    const email = `bs${d.id}@cbms.vn`;
    const u = await upsertUser(email, 'DOCTOR');
    if (d.userId !== u.id) {
      await prisma.doctor.update({ where: { id: d.id }, data: { userId: u.id } });
    }
  }

  // In bảng tài khoản
  const all = await prisma.user.findMany({
    where: { role: { not: 'PATIENT' } },
    orderBy: { id: 'asc' },
    include: { doctor: true },
  });
  console.log('=== Tài khoản nhân viên (mật khẩu: ' + PASS + ') ===');
  for (const u of all) {
    console.log(`${u.role.padEnd(13)} ${u.email}${u.doctor ? '  → ' + u.doctor.fullName : ''}`);
  }
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
