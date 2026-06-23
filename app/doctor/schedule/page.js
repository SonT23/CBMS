'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const WD = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function DoctorSchedule() {
  const router = useRouter();
  const [data, setData] = useState({ shifts: [], daysOff: [] });
  const [shift, setShift] = useState({ weekday: '1', startTime: '08:00', endTime: '11:00', slotMinutes: '30' });
  const [off, setOff] = useState('');
  const [days, setDays] = useState('7');
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    const r = await fetch('/api/doctor/worktime', { headers: auth });
    if (r.status === 403) { router.push('/login'); return; }
    setData(await r.json());
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const addShift = async () => {
    setMsg('');
    const r = await fetch('/api/doctor/worktime', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(shift) });
    const d = await r.json(); setMsg(r.ok ? 'Đã thêm ca.' : (d.error || 'Lỗi')); load();
  };
  const delShift = async (id) => { await fetch(`/api/doctor/worktime/${id}`, { method: 'DELETE', headers: auth }); load(); };
  const addOff = async () => { if (!off) return; await fetch('/api/doctor/dayoff', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ date: off }) }); setOff(''); load(); };
  const delOff = async (id) => { await fetch(`/api/doctor/dayoff/${id}`, { method: 'DELETE', headers: auth }); load(); };
  const generate = async () => {
    setMsg('');
    const r = await fetch('/api/doctor/worktime/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ days: Number(days) }) });
    const d = await r.json(); setMsg(r.ok ? `Đã sinh ${d.created} khung giờ trống cho ${days} ngày tới.` : (d.error || 'Lỗi'));
  };

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Lịch làm việc</h1>
        <p className="text-muted mb-5">Cấu hình ca làm việc & ngày nghỉ; sinh khung giờ trống cho bệnh nhân đặt</p>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-5">
          <h2 className="font-bold mb-3">Ca làm việc hàng tuần</h2>
          <div className="flex flex-wrap gap-2 items-end mb-3">
            <div><label className="text-xs text-muted">Thứ</label>
              <select value={shift.weekday} onChange={(e) => setShift({ ...shift, weekday: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm block">
                {WD.map((w, i) => <option key={i} value={i}>{w}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted">Bắt đầu</label><input type="time" value={shift.startTime} onChange={(e) => setShift({ ...shift, startTime: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm block" /></div>
            <div><label className="text-xs text-muted">Kết thúc</label><input type="time" value={shift.endTime} onChange={(e) => setShift({ ...shift, endTime: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm block" /></div>
            <div><label className="text-xs text-muted">Phút/slot</label><input type="number" value={shift.slotMinutes} onChange={(e) => setShift({ ...shift, slotMinutes: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm block w-20" /></div>
            <button onClick={addShift} className="bg-coral text-white font-semibold rounded-xl px-4 py-2 text-sm">+ Ca</button>
          </div>
          <div className="space-y-1">
            {data.shifts.length === 0 && <p className="text-muted text-sm">Chưa có ca làm việc.</p>}
            {data.shifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-t border-[#F0E6E0] py-1.5">
                <span>{WD[s.weekday]} · {s.startTime}–{s.endTime} · mỗi slot {s.slotMinutes}'</span>
                <button onClick={() => delShift(s.id)} className="text-coral text-xs">Xóa</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-5">
          <h2 className="font-bold mb-3">Ngày nghỉ</h2>
          <div className="flex items-center gap-2 mb-2">
            <input type="date" value={off} onChange={(e) => setOff(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
            <button onClick={addOff} className="border border-[#F0E6E0] text-ink font-semibold rounded-xl px-4 py-2 text-sm">+ Nghỉ</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.daysOff.map((o) => (
              <span key={o.id} className="text-sm bg-cream rounded-full px-3 py-1">{new Date(o.date).toLocaleDateString('vi-VN')} <button onClick={() => delOff(o.id)} className="text-coral ml-1">✕</button></span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4">
          <h2 className="font-bold mb-2">Sinh khung giờ trống</h2>
          <p className="text-sm text-muted mb-2">Tạo các slot đặt lịch từ ca làm việc cho N ngày tới (bỏ qua ngày nghỉ & giờ quá khứ).</p>
          <div className="flex items-center gap-2">
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm w-24" />
            <span className="text-sm text-muted">ngày tới</span>
            <button onClick={generate} className="bg-coral text-white font-semibold rounded-xl px-4 py-2 text-sm">Sinh khung giờ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
