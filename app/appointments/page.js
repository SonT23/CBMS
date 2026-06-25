'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appts, setAppts] = useState([]);
  const [msg, setMsg] = useState('');
  const [reId, setReId] = useState(null);     // appointment đang đổi lịch
  const [reSlots, setReSlots] = useState([]);
  const [reSlot, setReSlot] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    if (!token()) { router.push('/login'); return; }
    const res = await fetch('/api/appointments', { headers: auth });
    setAppts(await res.json());
  };
  useEffect(() => { load(); }, []);

  const cancel = async (a) => {
    setMsg('');
    if (!confirm('Hủy lịch hẹn này?')) return;
    const res = await fetch(`/api/appointments/${a.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ status: 'CANCELLED' }),
    });
    const d = await res.json();
    setMsg(res.ok ? (d.refunded ? 'Đã hủy lịch và hoàn tiền.' : 'Đã hủy lịch.') : (d.error || 'Lỗi hủy lịch'));
    load();
  };

  const openReschedule = async (a) => {
    setMsg(''); setReId(a.id); setReSlot('');
    const s = await (await fetch(`/api/doctors/${a.doctor.id}/slots`)).json();
    setReSlots(s);
  };
  const doReschedule = async (a) => {
    setMsg('');
    if (!reSlot) { setMsg('Hãy chọn khung giờ mới.'); return; }
    const res = await fetch(`/api/appointments/${a.id}/reschedule`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ newSlotId: Number(reSlot) }),
    });
    const d = await res.json();
    setMsg(res.ok ? 'Đã đổi lịch.' : (d.error || 'Lỗi đổi lịch'));
    if (res.ok) { setReId(null); load(); }
  };

  const badge = { CONFIRMED: 'bg-[#E6F4EC] text-greenx', CANCELLED: 'bg-[#FCE8E6] text-coral', CHECKED_IN: 'bg-[#FFF4E5] text-gold', COMPLETED: 'bg-tealLight text-teal' };
  const label = (s) => ({ CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', CHECKED_IN: 'Đã check-in', IN_PROGRESS: 'Đang khám', COMPLETED: 'Hoàn tất' }[s] || s);

  return (
    <div><Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Lịch hẹn của tôi</h1>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}
        {appts.length === 0 && <p className="text-muted">Bạn chưa có lịch hẹn nào.</p>}
        <div className="space-y-4">
          {appts.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{a.doctor.fullName} <span className="text-xs font-normal text-muted">· {a.doctor.specialty.name}</span></div>
                  <div className="text-sm text-muted mt-1">
                    {new Date(a.slot.date).toLocaleDateString('vi-VN')} · {a.slot.startTime}–{a.slot.endTime} · Mã: {a.code}
                    {a.patient ? ` · ${a.patient.fullName}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge[a.status] || 'bg-cream text-muted'}`}>{label(a.status)}</span>
                  {(a.status === 'CONFIRMED' || a.status === 'CHECKED_IN') && <button onClick={() => router.push(`/appointments/${a.id}/ticket`)} className="text-sm text-teal font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Phiếu QR</button>}
                  {a.status === 'CONFIRMED' && <button onClick={() => openReschedule(a)} className="text-sm text-ink font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Đổi lịch</button>}
                  {a.status === 'CONFIRMED' && <button onClick={() => cancel(a)} className="text-sm text-coral font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Hủy lịch</button>}
                </div>
              </div>
              {reId === a.id && (
                <div className="flex flex-wrap items-center gap-2 mt-3 border-t border-[#F0E6E0] pt-3">
                  <select value={reSlot} onChange={(e) => setReSlot(e.target.value)} className="flex-1 min-w-[200px] border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm">
                    <option value="">— Chọn khung giờ mới —</option>
                    {reSlots.map((s) => <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString('vi-VN')} · {s.startTime}</option>)}
                  </select>
                  <button onClick={() => doReschedule(a)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">Xác nhận đổi</button>
                  <button onClick={() => setReId(null)} className="text-muted text-sm">Hủy</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
