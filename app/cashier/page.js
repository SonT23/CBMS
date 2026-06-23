'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function CashierPage() {
  const router = useRouter();
  const [data, setData] = useState({ pending: [], paid: [], todayRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const load = async () => {
    const res = await fetch('/api/cashier', { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 403) { router.push('/login'); return; }
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const pay = async (invoiceId) => {
    setMsg('');
    const res = await fetch('/api/cashier/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ invoiceId, method: 'CASH' }),
    });
    const d = await res.json();
    if (res.ok) setMsg(`Đã thu hóa đơn ${d.invoice.code}`);
    load();
  };

  const money = (n) => n.toLocaleString('vi-VN') + 'đ';

  return (
    <div>
      <Nav />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Thu ngân &amp; Hóa đơn</h1>
            <p className="text-muted">Thu phí khám và xuất hóa đơn</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm px-6 py-3 text-center">
            <div className="text-xs text-muted">Doanh thu hôm nay</div>
            <div className="text-2xl font-bold text-greenx">{money(data.todayRevenue)}</div>
          </div>
        </div>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}
        {loading && <p className="text-muted">Đang tải...</p>}

        <h2 className="font-bold text-lg mb-3">Hóa đơn chờ thanh toán ({data.pending.length})</h2>
        <div className="space-y-3 mb-8">
          {data.pending.length === 0 && <p className="text-muted text-sm">Không có hóa đơn chờ thu.</p>}
          {data.pending.map((inv) => (
            <div key={inv.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{inv.patient.fullName} <span className="text-xs font-normal text-muted">· {inv.code}</span></div>
                <div className="text-sm text-muted">
                  {inv.appointment.doctor.fullName} · {inv.appointment.doctor.specialty.name}
                  {inv.appointment.record?.diagnosis ? ` · CĐ: ${inv.appointment.record.diagnosis}` : ''}
                </div>
                <div className="text-xs text-muted mt-1">
                  Khám {money(inv.examFee)}{inv.labFee ? ` · CLS ${money(inv.labFee)}` : ''}{inv.medFee ? ` · Thuốc ${money(inv.medFee)}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted">Phí khám</div>
                  <div className="font-bold text-coral">{money(inv.totalAmount)}</div>
                </div>
                <button onClick={() => pay(inv.id)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl">Thu tiền mặt</button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-bold text-lg mb-3">Đã thanh toán gần đây</h2>
        <div className="space-y-2">
          {data.paid.length === 0 && <p className="text-muted text-sm">Chưa có hóa đơn đã thu.</p>}
          {data.paid.map((inv) => (
            <div key={inv.id} className="bg-cream rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="font-medium">{inv.patient.fullName} · {inv.code}</span>
              <span className="text-muted">{inv.paidAt ? new Date(inv.paidAt).toLocaleString('vi-VN') : ''}</span>
              <span className="font-bold text-greenx">{money(inv.totalAmount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
