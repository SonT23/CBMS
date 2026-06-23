'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function PharmacyPage() {
  const router = useRouter();
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState({ pending: [], meds: [], lowStock: [] });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  const load = async () => {
    const res = await fetch('/api/pharmacy', { headers: auth });
    if (res.status === 403) { router.push('/login'); return; }
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const dispense = async (prescriptionId) => {
    setMsg('');
    const res = await fetch('/api/pharmacy/dispense', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ prescriptionId }),
    });
    const d = await res.json();
    setMsg(res.ok ? 'Đã xuất thuốc & trừ kho.' : (d.error || 'Lỗi xuất thuốc'));
    load();
  };

  const total = (items) => items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Nhà thuốc</h1>
        <p className="text-muted mb-5">Soạn &amp; xuất thuốc, quản lý tồn kho</p>
        <div className="flex bg-cream rounded-xl p-1 mb-6 w-fit">
          {[['orders', `Đơn chờ xuất (${data.pending.length})`], ['stock', `Tồn kho${data.lowStock.length ? ` · ${data.lowStock.length} cảnh báo` : ''}`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${tab === k ? 'bg-white text-coral shadow-sm' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}
        {loading && <p className="text-muted">Đang tải...</p>}

        {tab === 'orders' && (
          <div className="space-y-4">
            {!loading && data.pending.length === 0 && <p className="text-muted">Không có đơn thuốc chờ xuất.</p>}
            {data.pending.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold">{p.patient.fullName} <span className="text-xs font-normal text-muted">· {p.code}</span></div>
                    <div className="text-sm text-muted">Kê bởi {p.doctor.fullName}</div>
                  </div>
                  <span className="font-bold text-coral">{money(total(p.items))}</span>
                </div>
                <div className="space-y-1 mb-4">
                  {p.items.map((it) => {
                    const low = it.medication.stock < it.quantity;
                    return (
                      <div key={it.id} className="flex justify-between text-sm border-t border-[#F0E6E0] pt-1">
                        <span>{it.medName} × {it.quantity} {it.medication.unit}{it.dosage ? ` · ${it.dosage}` : ''}</span>
                        <span className={low ? 'text-coral font-semibold' : 'text-muted'}>tồn: {it.medication.stock}{low ? ' (thiếu!)' : ''}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => dispense(p.id)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Xuất thuốc &amp; trừ kho</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'stock' && (
          <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream text-muted">
                <tr><th className="text-left px-4 py-2">Thuốc</th><th className="text-left px-4 py-2">Đơn giá</th><th className="text-right px-4 py-2">Tồn kho</th><th className="text-right px-4 py-2">Ngưỡng</th><th className="text-right px-4 py-2">Trạng thái</th></tr>
              </thead>
              <tbody>
                {data.meds.map((m) => {
                  const low = m.stock <= m.reorderLevel;
                  return (
                    <tr key={m.id} className="border-t border-[#F0E6E0]">
                      <td className="px-4 py-2 font-medium">{m.name}</td>
                      <td className="px-4 py-2 text-muted">{money(m.price)}/{m.unit}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${low ? 'text-coral' : ''}`}>{m.stock}</td>
                      <td className="px-4 py-2 text-right text-muted">{m.reorderLevel}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${low ? 'bg-[#FCE8E6] text-coral' : 'bg-[#E6F4EC] text-greenx'}`}>{low ? 'Sắp hết' : 'Đủ'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
