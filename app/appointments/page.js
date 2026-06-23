'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appts, setAppts] = useState([]);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const res = await fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
    setAppts(await res.json());
  };
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    load();
  };

  const badge = { CONFIRMED: 'bg-[#E6F4EC] text-greenx', CANCELLED: 'bg-[#FCE8E6] text-coral' };

  return (
    <div><Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Lịch hẹn của tôi</h1>
        {appts.length === 0 && <p className="text-muted">Bạn chưa có lịch hẹn nào.</p>}
        <div className="space-y-4">
          {appts.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 flex items-center justify-between">
              <div>
                <div className="font-bold">{a.doctor.fullName} <span className="text-xs font-normal text-muted">· {a.doctor.specialty.name}</span></div>
                <div className="text-sm text-muted mt-1">
                  {new Date(a.slot.date).toLocaleDateString('vi-VN')} · {a.slot.startTime}–{a.slot.endTime} · Mã: {a.code}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge[a.status] || 'bg-cream text-muted'}`}>
                  {a.status === 'CONFIRMED' ? 'Đã xác nhận' : a.status === 'CANCELLED' ? 'Đã hủy' : a.status}
                </span>
                {(a.status === 'CONFIRMED' || a.status === 'CHECKED_IN') && <button onClick={() => router.push(`/appointments/${a.id}/ticket`)} className="text-sm text-teal font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Phiếu QR</button>}
                {a.status === 'CONFIRMED' && <button onClick={() => cancel(a.id)} className="text-sm text-coral font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Hủy lịch</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
