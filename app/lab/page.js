'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const STATUS_LABEL = { NEW: 'Mới', RECEIVED: 'Đã tiếp nhận', IN_PROGRESS: 'Đang thực hiện', HAS_RESULT: 'Có kết quả' };

export default function LabPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState({}); // itemId -> {result, abnormal}
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    const res = await fetch('/api/lab', { headers: auth });
    if (res.status === 403) { router.push('/login'); return; }
    const d = await res.json();
    setOrders(d);
    const e = {};
    d.forEach((o) => o.items.forEach((it) => { e[it.id] = { result: it.result || '', abnormal: it.abnormal }; }));
    setEdit(e);
    setLoading(false);
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const act = async (labOrderId, action, items) => {
    setMsg('');
    const results = (items || []).map((it) => ({ itemId: it.id, result: edit[it.id]?.result, abnormal: edit[it.id]?.abnormal }));
    const res = await fetch('/api/lab/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ labOrderId, action, results }),
    });
    if (res.ok) setMsg(action === 'send' ? 'Đã gửi kết quả cho bác sĩ.' : action === 'receive' ? 'Đã tiếp nhận phiếu.' : 'Đã lưu kết quả.');
    load();
  };

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Cận lâm sàng</h1>
        <p className="text-muted mb-6">Tiếp nhận phiếu chỉ định và nhập kết quả xét nghiệm</p>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && orders.length === 0 && <p className="text-muted">Không có phiếu CLS chờ xử lý.</p>}
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold">{o.patient.fullName} <span className="text-xs font-normal text-muted">· {o.code}</span></div>
                  <div className="text-sm text-muted">Chỉ định bởi {o.doctor.fullName}</div>
                </div>
                <span className="text-xs font-semibold bg-tealLight text-teal px-2 py-1 rounded-full">{STATUS_LABEL[o.status] || o.status}</span>
              </div>
              <div className="space-y-2">
                {o.items.map((it) => (
                  <div key={it.id} className="flex flex-wrap items-center gap-2 border-t border-[#F0E6E0] pt-2">
                    <span className="text-sm font-medium flex-1 min-w-[160px]">{it.testName}</span>
                    {o.status === 'NEW' ? (
                      <span className="text-sm text-muted">Chờ tiếp nhận</span>
                    ) : (
                      <>
                        <input value={edit[it.id]?.result || ''} onChange={(e) => setEdit({ ...edit, [it.id]: { ...edit[it.id], result: e.target.value } })}
                          placeholder="Kết quả..." className="flex-1 min-w-[180px] border border-[#F0E6E0] rounded-lg px-2 py-1.5 text-sm" />
                        <label className="text-sm text-coral flex items-center gap-1">
                          <input type="checkbox" checked={!!edit[it.id]?.abnormal} onChange={(e) => setEdit({ ...edit, [it.id]: { ...edit[it.id], abnormal: e.target.checked } })} />
                          Bất thường
                        </label>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                {o.status === 'NEW' && <button onClick={() => act(o.id, 'receive')} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Tiếp nhận</button>}
                {o.status !== 'NEW' && (
                  <>
                    <button onClick={() => act(o.id, 'save', o.items)} className="border border-[#F0E6E0] text-ink font-semibold px-4 py-2 rounded-xl text-sm">Lưu kết quả</button>
                    <button onClick={() => act(o.id, 'send', o.items)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Gửi bác sĩ</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
