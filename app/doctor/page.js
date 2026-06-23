'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function DoctorQueuePage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const load = async () => {
    const res = await fetch('/api/doctor/queue', { headers: { Authorization: `Bearer ${token()}` } });
    if (res.status === 403) { router.push('/login'); return; }
    const d = await res.json();
    setDoctor(d.doctor); setQueue(d.queue); setLoading(false);
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Phòng khám {doctor ? `· ${doctor.fullName}` : ''}</h1>
        <p className="text-muted mb-6">Danh sách bệnh nhân đang chờ khám</p>
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && queue.length === 0 && <p className="text-muted">Chưa có bệnh nhân nào trong hàng chờ.</p>}
        <div className="space-y-3">
          {queue.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tealLight text-teal flex items-center justify-center font-bold text-lg">#{a.queueNumber}</div>
              <div className="flex-1">
                <div className="font-bold">{a.patient.fullName}</div>
                <div className="text-sm text-muted">{a.slot ? `${new Date(a.slot.date).toLocaleDateString('vi-VN')} · ${a.slot.startTime}` : ''} · Mã: {a.code}</div>
                {a.note && <div className="text-xs text-muted mt-1">Lý do: {a.note}</div>}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.status === 'IN_PROGRESS' ? 'bg-[#FFF4E5] text-gold' : 'bg-tealLight text-teal'}`}>
                {a.status === 'IN_PROGRESS' ? 'Đang khám' : 'Chờ khám'}
              </span>
              <button onClick={() => router.push(`/doctor/${a.id}`)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl">
                {a.record ? 'Tiếp tục' : 'Khám'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
