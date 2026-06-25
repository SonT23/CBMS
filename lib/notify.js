import { prisma } from './prisma';

// FN-08 — tạo thông báo in-app (best-effort, không làm vỡ luồng chính nếu lỗi).
export async function notify(userId, type, title, body, link) {
  if (!userId) return;
  try {
    await prisma.notification.create({ data: { userId, type, title, body: body || null, link: link || null } });
  } catch (e) { /* ignore */ }
}

// Lấy userId của bệnh nhân sở hữu một hồ sơ (patientId).
export async function patientUserId(patientId) {
  const p = await prisma.patient.findUnique({ where: { id: patientId } });
  return p?.userId || null;
}
