const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialty.deleteMany();

  const specs = ['Nội tổng quát', 'Nhi khoa', 'Da liễu', 'Tim mạch', 'Tai mũi họng', 'Răng hàm mặt'];
  const specMap = {};
  for (const name of specs) {
    const s = await prisma.specialty.create({ data: { name } });
    specMap[name] = s.id;
  }

  const doctors = [
    { fullName: 'BS. Nguyễn Văn An', spec: 'Nội tổng quát', fee: 200000, experience: 12, rating: 4.9 },
    { fullName: 'BS. Trần Thị Mai', spec: 'Nhi khoa', fee: 250000, experience: 9, rating: 4.8 },
    { fullName: 'BS. Lê Quốc Huy', spec: 'Da liễu', fee: 300000, experience: 7, rating: 4.7 },
    { fullName: 'BS. Phạm Thu Hà', spec: 'Tim mạch', fee: 350000, experience: 15, rating: 5.0 },
    { fullName: 'BS. Võ Minh Khoa', spec: 'Tai mũi họng', fee: 220000, experience: 6, rating: 4.6 },
    { fullName: 'BS. Đặng Thị Lan', spec: 'Răng hàm mặt', fee: 280000, experience: 10, rating: 4.9 },
  ];
  const times = [['08:00','08:30'],['08:30','09:00'],['09:00','09:30'],['09:30','10:00'],['10:00','10:30'],['10:30','11:00']];

  for (const d of doctors) {
    const doc = await prisma.doctor.create({
      data: { fullName: d.fullName, specialtyId: specMap[d.spec], fee: d.fee, experience: d.experience, rating: d.rating },
    });
    for (let day = 1; day <= 5; day++) {
      const date = new Date(); date.setDate(date.getDate() + day); date.setHours(0, 0, 0, 0);
      for (const [s, e] of times) {
        await prisma.scheduleSlot.create({ data: { doctorId: doc.id, date, startTime: s, endTime: e, available: true } });
      }
    }
  }
  console.log('Seed xong:', specs.length, 'chuyên khoa,', doctors.length, 'bác sĩ, mỗi bác sĩ 5 ngày x 6 slot.');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
