'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function PharmacyPage() {
  const router = useRouter();
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState({ pending: [], meds: [], lowStock: [] });
  const [batches, setBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bform, setBform] = useState({ medicationId: '', supplierId: '', batchNo: '', quantity: '', expiry: '' });
  const [sname, setSname] = useState('');
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
  const loadBatches = async () => {
    setBatches(await (await fetch('/api/pharmacy/batches', { headers: auth })).json());
    setSuppliers(await (await fetch('/api/pharmacy/suppliers', { headers: auth })).json());
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); loadBatches(); }, []);

  const addSupplier = async () => {
    if (!sname.trim()) return;
    await fetch('/api/pharmacy/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ name: sname }) });
    setSname(''); loadBatches();
  };
  const addBatch = async () => {
    setMsg('');
    const res = await fetch('/api/pharmacy/batches', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(bform) });
    const d = await res.json();
    setMsg(res.ok ? 'Đã nhập lô thuốc & cộng tồn kho.' : (d.error || 'Lỗi nhập lô'));
    if (res.ok) { setBform({ medicationId: '', supplierId: '', batchNo: '', quantity: '', expiry: '' }); loadBatches(); load(); }
  };

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
          {[['orders', `Đơn chờ xuất (${data.pending.length})`], ['stock', `Tồn kho${data.lowStock.length ? ` · ${data.lowStock.length} cảnh báo` : ''}`], ['batches', 'Lô & NCC']].map(([k, label]) => (
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
                <div className="flex gap-2">
                  <button onClick={() => dispense(p.id)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Xuất thuốc &amp; trừ kho</button>
                  <button onClick={() => window.open(`/pharmacy/label/${p.id}`, '_blank')} className="border border-[#F0E6E0] text-ink font-semibold px-4 py-2 rounded-xl text-sm">In tem</button>
                </div>
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

        {tab === 'batches' && (
          <div className="space-y-6">
            {/* Form nhập lô */}
            <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4">
              <h2 className="font-bold mb-3">Nhập lô thuốc mới</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <select value={bform.medicationId} onChange={(e) => setBform({ ...bform, medicationId: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm">
                  <option value="">— Chọn thuốc —</option>
                  {data.meds.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select value={bform.supplierId} onChange={(e) => setBform({ ...bform, supplierId: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm">
                  <option value="">— Nhà cung cấp —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input value={bform.batchNo} onChange={(e) => setBform({ ...bform, batchNo: e.target.value })} placeholder="Số lô" className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
                <input type="number" min="1" value={bform.quantity} onChange={(e) => setBform({ ...bform, quantity: e.target.value })} placeholder="Số lượng" className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
                <input type="date" value={bform.expiry} onChange={(e) => setBform({ ...bform, expiry: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
                <button onClick={addBatch} className="bg-coral text-white font-semibold rounded-xl px-4 py-2 text-sm">Nhập lô</button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input value={sname} onChange={(e) => setSname(e.target.value)} placeholder="Thêm nhà cung cấp..." className="flex-1 min-w-[180px] border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
                <button onClick={addSupplier} className="border border-[#F0E6E0] text-ink font-semibold rounded-xl px-4 py-2 text-sm">+ NCC</button>
              </div>
            </div>
            {/* Bảng lô */}
            <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream text-muted">
                  <tr><th className="text-left px-4 py-2">Thuốc</th><th className="text-left px-4 py-2">Số lô</th><th className="text-left px-4 py-2">NCC</th><th className="text-right px-4 py-2">SL</th><th className="text-left px-4 py-2">Hạn dùng</th><th className="text-right px-4 py-2">Trạng thái</th></tr>
                </thead>
                <tbody>
                  {batches.length === 0 && <tr><td colSpan={6} className="px-4 py-3 text-muted">Chưa có lô thuốc.</td></tr>}
                  {batches.map((b) => (
                    <tr key={b.id} className="border-t border-[#F0E6E0]">
                      <td className="px-4 py-2 font-medium">{b.medication}</td>
                      <td className="px-4 py-2">{b.batchNo}</td>
                      <td className="px-4 py-2 text-muted">{b.supplier}</td>
                      <td className="px-4 py-2 text-right">{b.quantity}</td>
                      <td className="px-4 py-2">{new Date(b.expiry).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.expired ? 'bg-[#FCE8E6] text-coral' : b.nearExpiry ? 'bg-[#FFF4E5] text-gold' : 'bg-[#E6F4EC] text-greenx'}`}>
                          {b.expired ? 'Hết hạn' : b.nearExpiry ? 'Sắp hết hạn' : 'Còn hạn'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
