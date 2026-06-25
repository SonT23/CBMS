'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function HistoryPage() {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    fetch('/api/me/visits', { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json()).then((d) => { setVisits(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Lịch sử khám bệnh</h1>
        <p className="text-muted mb-6">Các lượt khám đã hoàn tất của bạn</p>
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && visits.length === 0 && <p className="text-muted">Bạn chưa có lượt khám nào hoàn tất.</p>}
        <div className="space-y-4">
          {visits.map((v) => (
            <div key={v.id} onClick={() => router.push(`/history/${v.id}`)}
              className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition">
              <div>
                <div className="font-bold">{v.doctor} <span className="text-xs font-normal text-muted">· {v.specialty}</span></div>
                <div className="text-sm text-muted mt-1">
                  {v.date ? new Date(v.date).toLocaleDateString('vi-VN') : ''} {v.startTime ? `· ${v.startTime}` : ''} · Mã: {v.code}
                </div>
                {v.diagnosis && <div className="text-sm text-ink mt-1">Chẩn đoán: {v.diagnosis}</div>}
              </div>
              <div className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="font-bold text-coral">{money(v.total)}</div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.invoiceStatus === 'PAID' ? 'bg-[#E6F4EC] text-greenx' : v.invoiceStatus === 'REFUNDED' ? 'bg-[#FCE8E6] text-coral' : 'bg-[#FFF4E5] text-gold'}`}>
                  {v.invoiceStatus === 'PAID' ? 'Đã thanh toán' : v.invoiceStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}
                </span>
                {v.invoiceId && (
                  <div className="mt-2">
                    {v.invoiceStatus === 'PENDING_PAYMENT'
                      ? <button onClick={() => router.push(`/pay/${v.invoiceId}`)} className="text-xs bg-coral text-white font-semibold px-3 py-1.5 rounded-lg">Thanh toán online</button>
                      : <button onClick={() => router.push(`/invoice/${v.invoiceId}`)} className="text-xs text-teal font-semibold border border-[#F0E6E0] px-3 py-1.5 rounded-lg">Hóa đơn điện tử</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
