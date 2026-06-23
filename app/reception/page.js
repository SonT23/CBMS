'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function ReceptionPage() {
  const router = useRouter();
  const [data, setData] = useState({ waiting: [], queue: [] });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [qr, setQr] = useState('');

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const load = async () => {
    const res = await fetch('/api/reception', { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 403) { router.push('/login'); return; }
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    load();
  }, []);

  const checkin = async (id) => {
    setMsg('');
    const res = await fetch('/api/reception/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ appointmentId: id }),
    });
    const d = await res.json();
    if (res.ok) setMsg(`Đã check-in — STT #${d.queueNumber}`);
    load();
  };

  const checkinQr = async () => {
    setMsg('');
    if (!qr.trim()) return;
    const res = await fetch('/api/reception/checkin-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ qrToken: qr.trim() }),
    });
    const d = await res.json();
    setMsg(res.ok ? `Đã check-in ${d.patient} bằng QR — STT #${d.queueNumber}` : (d.error || 'Lỗi check-in QR'));
    setQr(''); load();
  };

  const fmt = (a) => `${new Date(a.slot.date).toLocaleDateString('vi-VN')} · ${a.slot.startTime}`;

  return (
    <div>
      <Nav />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Tiếp đón &amp; Hàng chờ</h1>
        <p className="text-muted mb-6">Xác nhận bệnh nhân đến khám và cấp số thứ tự</p>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}
        {/* OLD-6 — Check-in bằng mã QR */}
        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">Check-in nhanh bằng QR:</span>
          <input value={qr} onChange={(e) => setQr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkinQr()}
            placeholder="Quét hoặc nhập mã QR trên phiếu khám" className="flex-1 min-w-[220px] border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
          <button onClick={checkinQr} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Check-in QR</button>
        </div>
        {loading && <p className="text-muted">Đang tải...</p>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chờ tiếp đón */}
          <div>
            <h2 className="font-bold text-lg mb-3">Chờ tiếp đón ({data.waiting.length})</h2>
            <div className="space-y-3">
              {data.waiting.length === 0 && <p className="text-muted text-sm">Không có lịch chờ tiếp đón.</p>}
              {data.waiting.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{a.patient.fullName}</div>
                    <div className="text-sm text-muted">{a.doctor.fullName} · {a.doctor.specialty.name}</div>
                    <div className="text-xs text-muted mt-1">{fmt(a)} · Mã: {a.code}</div>
                  </div>
                  <button onClick={() => checkin(a.id)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl">Check-in</button>
                </div>
              ))}
            </div>
          </div>
          {/* Hàng chờ khám */}
          <div>
            <h2 className="font-bold text-lg mb-3">Hàng chờ khám ({data.queue.length})</h2>
            <div className="space-y-3">
              {data.queue.length === 0 && <p className="text-muted text-sm">Chưa có bệnh nhân trong hàng chờ.</p>}
              {data.queue.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-tealLight text-teal flex items-center justify-center font-bold text-lg">#{a.queueNumber}</div>
                  <div className="flex-1">
                    <div className="font-bold">{a.patient.fullName}</div>
                    <div className="text-sm text-muted">{a.doctor.fullName} · {a.doctor.specialty.name}</div>
                  </div>
                  <span className="text-xs font-semibold bg-[#FFF4E5] text-gold px-2 py-1 rounded-full">Đã check-in</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
