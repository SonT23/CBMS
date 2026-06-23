'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function TicketPage() {
  const router = useRouter();
  const { id } = useParams();
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    fetch(`/api/appointments/${id}/ticket`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(async (r) => { if (!r.ok) { setErr((await r.json()).error || 'Lỗi'); return null; } return r.json(); })
      .then((d) => d && setT(d));
  }, [id]);

  if (err) return (<div><Nav /><div className="max-w-md mx-auto p-8"><p className="text-coral">{err}</p></div></div>);
  if (!t) return (<div><Nav /><div className="max-w-md mx-auto p-8 text-muted">Đang tải...</div></div>);

  return (
    <div>
      <Nav />
      <div className="max-w-md mx-auto p-8">
        <button onClick={() => router.push('/appointments')} className="text-muted text-sm mb-4">← Lịch hẹn của tôi</button>
        <div className="bg-white rounded-3xl border border-[#F0E6E0] shadow-sm p-6 text-center">
          <h1 className="text-xl font-bold mb-1">Phiếu khám điện tử</h1>
          <p className="text-muted text-sm mb-4">Xuất trình mã này tại quầy tiếp đón</p>
          {t.qrDataUrl && <img src={t.qrDataUrl} alt="QR check-in" className="mx-auto w-48 h-48" />}
          <div className="text-2xl font-bold text-coral mt-3">{t.code}</div>
          <div className="text-left text-sm mt-4 space-y-1">
            <div className="flex justify-between border-b border-[#F0E6E0] py-1"><span className="text-muted">Bệnh nhân</span><span className="font-medium">{t.patient}</span></div>
            <div className="flex justify-between border-b border-[#F0E6E0] py-1"><span className="text-muted">Bác sĩ</span><span className="font-medium">{t.doctor} · {t.specialty}</span></div>
            <div className="flex justify-between border-b border-[#F0E6E0] py-1"><span className="text-muted">Thời gian</span><span className="font-medium">{t.date ? new Date(t.date).toLocaleDateString('vi-VN') : ''} {t.startTime || ''}</span></div>
            <div className="flex justify-between py-1"><span className="text-muted">Trạng thái</span><span className="font-medium">{t.status === 'CONFIRMED' ? 'Đã xác nhận' : t.status === 'CHECKED_IN' ? 'Đã check-in' : t.status}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
