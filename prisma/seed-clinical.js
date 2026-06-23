// Seed M5/M6: dịch vụ CLS, thuốc (tồn kho) + tài khoản KTV / Dược sĩ. Idempotent.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const PASS = 'Abc@1234';

const LAB_TESTS = [
  { name: 'Xét nghiệm công thức máu', price: 120000 },
  { name: 'Xét nghiệm đường huyết', price: 80000 },
  { name: 'Xét nghiệm mỡ máu', price: 150000 },
  { name: 'X-quang ngực thẳng', price: 200000 },
  { name: 'Siêu âm ổ bụng', price: 250000 },
  { name: 'Điện tâm đồ (ECG)', price: 180000 },
];

const MEDS = [
  { name: 'Paracetamol 500mg', unit: 'viên', price: 2000, stock: 500, reorderLevel: 50 },
  { name: 'Amoxicillin 500mg', unit: 'viên', price: 3500, stock: 300, reorderLevel: 50 },
  { name: 'Omeprazole 20mg', unit: 'viên', price: 4000, stock: 200, reorderLevel: 40 },
  { name: 'Loratadine 10mg', unit: 'viên', price: 2500, stock: 150, reorderLevel: 30 },
  { name: 'Vitamin C 1000mg', unit: 'viên', price: 1500, stock: 600, reorderLevel: 60 },
  { name: 'Berberin', unit: 'viên', price: 1000, stock: 25, reorderLevel: 40 }, // dưới ngưỡng -> cảnh báo
  { name: 'Oresol', unit: 'gói', price: 5000, stock: 120, reorderLevel: 30 },
  { name: 'Salbutamol xịt', unit: 'lọ', price: 65000, stock: 18, reorderLevel: 20 }, // dưới ngưỡng
];

async function upsertUser(email, role) {
  return prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, passwordHash: bcrypt.hashSync(PASS, 10), role, status: 'ACTIVE' },
  });
}

async function main() {
  if ((await prisma.labTest.count()) === 0) await prisma.labTest.createMany({ data: LAB_TESTS });
  if ((await prisma.medication.count()) === 0) await prisma.medication.createMany({ data: MEDS });
  await upsertUser('ktv@cbms.vn', 'LAB_TECH');
  await upsertUser('duocsi@cbms.vn', 'PHARMACIST');

  console.log('Dịch vụ CLS:', await prisma.labTest.count(), '| Thuốc:', await prisma.medication.count());
  const lowStock = await prisma.medication.findMany({ where: {} });
  console.log('Thuốc sắp hết:', lowStock.filter((m) => m.stock <= m.reorderLevel).map((m) => m.name).join(', ') || '(không)');
  console.log('Tài khoản mới: ktv@cbms.vn (LAB_TECH), duocsi@cbms.vn (PHARMACIST) — mật khẩu', PASS);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
