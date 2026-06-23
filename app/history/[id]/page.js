'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function VisitDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [v, setV] = useState(null);
  const [err, setErr] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    fetch(`/api/me/visits/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(async (r) => { if (!r.ok) { setErr((await r.json()).error || 'Lỗi'); return null; } return r.json(); })
      .then((d) => d && setV(d));
  }, [id]);

  const Card = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 mb-4">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      {children}
    </div>
  );
  const Row = ({ l, val }) => val ? (
    <div className="flex justify-between py-1.5 border-b border-[#F0E6E0] last:border-0 text-sm">
      <span className="text-muted">{l}</span><span className="font-medium text-ink text-right max-w-[60%]">{val}</span>
    </div>
  ) : null;

  if (err) return (<div><Nav /><div className="max-w-3xl mx-auto p-8"><p className="text-coral">{err}</p></div></div>);
  if (!v) return (<div><Nav /><div className="max-w-3xl mx-auto p-8 text-muted">Đang tải...</div></div>);
  const r = v.record || {};

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto p-8">
        <button onClick={() => router.push('/history')} className="text-muted text-sm mb-4">← Lịch sử khám</button>
        <h1 className="text-2xl font-bold mb-1">Chi tiết lượt khám · {v.code}</h1>
        <p className="text-muted mb-6">{v.doctor?.fullName} · {v.doctor?.specialty?.name} · {v.slot ? new Date(v.slot.date).toLocaleDateString('vi-VN') : ''} {v.slot?.startTime || ''}</p>

        <Card title="Sinh hiệu">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
            <Row l="Huyết áp" val={r.bloodPressure} />
            <Row l="Nhiệt độ" val={r.temperature && `${r.temperature}°C`} />
            <Row l="Nhịp tim" val={r.heartRate && `${r.heartRate} l/p`} />
            <Row l="SpO₂" val={r.spo2 && `${r.spo2}%`} />
            <Row l="Cân nặng" val={r.weight && `${r.weight} kg`} />
            <Row l="Chiều cao" val={r.height && `${r.height} cm`} />
            <Row l="BMI" val={r.bmi} />
          </div>
        </Card>

        <Card title="Chẩn đoán & kết luận">
          <Row l="Triệu chứng" val={r.symptoms} />
          <Row l="Chẩn đoán" val={r.diagnosis} />
          <Row l="Kết luận" val={r.conclusion} />
          <Row l="Lời dặn" val={r.advice} />
        </Card>

        {v.labOrder && v.labOrder.items.length > 0 && (
          <Card title="Kết quả cận lâm sàng">
            {v.labOrder.items.map((it) => (
              <div key={it.id} className="flex justify-between py-1.5 border-b border-[#F0E6E0] last:border-0 text-sm">
                <span className="text-ink">{it.testName}</span>
                <span className={it.abnormal ? 'text-coral font-semibold' : 'text-muted'}>{it.result || 'Chưa có'}{it.abnormal ? ' (bất thường)' : ''}</span>
              </div>
            ))}
          </Card>
        )}

        {v.prescription && v.prescription.items.length > 0 && (
          <Card title="Đơn thuốc">
            {v.prescription.items.map((it) => (
              <div key={it.id} className="flex justify-between py-1.5 border-b border-[#F0E6E0] last:border-0 text-sm">
                <span className="text-ink">{it.medName} × {it.quantity}{it.dosage ? ` · ${it.dosage}` : ''}</span>
                <span className="text-muted">{money(it.price * it.quantity)}</span>
              </div>
            ))}
          </Card>
        )}

        {v.invoice && (
          <Card title="Hóa đơn">
            <Row l="Phí khám" val={money(v.invoice.examFee)} />
            {v.invoice.labFee ? <Row l="Phí cận lâm sàng" val={money(v.invoice.labFee)} /> : null}
            {v.invoice.medFee ? <Row l="Tiền thuốc" val={money(v.invoice.medFee)} /> : null}
            <div className="flex justify-between pt-2 mt-1 font-bold">
              <span>Tổng cộng</span><span className="text-coral">{money(v.invoice.totalAmount)}</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.invoice.status === 'PAID' ? 'bg-[#E6F4EC] text-greenx' : 'bg-[#FFF4E5] text-gold'}`}>
                {v.invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
