import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notify, patientUserId } from '@/lib/notify';

// action: 'receive' | 'save' | 'send'
export async function POST(req) {
  const u = getUser(req);
  if (!u || !['LAB_TECH', 'ADMIN'].includes(u.role))
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const { labOrderId, action, results = [] } = await req.json();
  const order = await prisma.labOrder.findUnique({ where: { id: labOrderId } });
  if (!order) return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });

  if (action === 'receive') {
    await prisma.labOrder.update({ where: { id: labOrderId }, data: { status: 'RECEIVED' } });
    return NextResponse.json({ ok: true });
  }

  // save / send: cập nhật kết quả từng mục
  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      await tx.labOrderItem.update({
        where: { id: r.itemId },
        data: { result: r.result || null, abnormal: !!r.abnormal },
      });
    }
    const status = action === 'send' ? 'SENT_DOCTOR' : 'HAS_RESULT';
    await tx.labOrder.update({ where: { id: labOrderId }, data: { status } });
  });
  if (action === 'send') {
    const uid = await patientUserId(order.patientId);
    await notify(uid, 'LAB_RESULT', 'Đã có kết quả cận lâm sàng', 'Kết quả CLS của bạn đã sẵn sàng. Xem trong Lịch sử khám.', '/history');
  }
  return NextResponse.json({ ok: true });
}
