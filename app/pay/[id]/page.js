'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

// FN-06 — Trang thanh toán online (MÔ PHỎNG cổng VNPAY/MoMo).
export default function PayPage() {
  const router = useRouter();
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [err, setErr] = useState('');
  const [paying, setPaying] = useState(false);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    fetch(`/api/invoices/${id}`, { headers: auth })
      .then(async (r) => { if (!r.ok) { setErr((await r.json()).error || 'Lỗi'); return null; } return r.json(); })
      .then((d) => d && setInv(d));
  }, [id]);

  const pay = async () => {
    setPaying(true); setErr('');
    const r = await fetch('/api/payments/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ invoiceId: Number(id) }) });
    const d = await r.json(); setPaying(false);
    if (!r.ok) { setErr(d.error || 'Thanh toán thất bại'); return; }
    router.push(`/invoice/${id}`);
  };

  if (err) return (<div><Nav /><div className="max-w-md mx-auto p-8"><p className="text-coral">{err}</p></div></div>);
  if (!inv) return (<div><Nav /><div className="max-w-md mx-auto p-8 text-muted">Đang tải...</div></div>);

  return (
    <div>
      <Nav />
      <div className="max-w-md mx-auto p-8">
        <div className="bg-white rounded-3xl border border-[#F0E6E0] shadow-sm p-6 text-center">
          <div className="text-xs font-semibold text-teal bg-tealLight inline-block px-3 py-1 rounded-full mb-3">Cổng thanh toán (mô phỏng)</div>
          <h1 className="text-xl font-bold mb-1">Thanh toán hóa đơn</h1>
          <p className="text-muted text-sm mb-4">{inv.code} · {inv.patient.fullName}</p>
          <div className="text-left text-sm bg-cream rounded-xl p-4 mb-4">
            <div className="flex justify-between py-1"><span className="text-muted">Phí khám</span><span>{money(inv.examFee)}</span></div>
            {inv.labFee ? <div className="flex justify-between py-1"><span className="text-muted">Cận lâm sàng</span><span>{money(inv.labFee)}</span></div> : null}
            {inv.medFee ? <div className="flex justify-between py-1"><span className="text-muted">Tiền thuốc</span><span>{money(inv.medFee)}</span></div> : null}
            <div className="flex justify-between border-t border-[#F0E6E0] mt-1 pt-2 font-bold"><span>Tổng</span><span className="text-coral">{money(inv.totalAmount)}</span></div>
          </div>
          {inv.status === 'PAID' ? (
            <p className="text-greenx font-semibold">Hóa đơn đã thanh toán.</p>
          ) : (
            <button disabled={paying} onClick={pay} className="w-full bg-coral text-white font-semibold py-3 rounded-xl disabled:opacity-50">
              {paying ? 'Đang xử lý...' : `Thanh toán ${money(inv.totalAmount)}`}
            </button>
          )}
          <p className="text-xs text-muted mt-3">* Đây là cổng mô phỏng phục vụ demo; không phát sinh giao dịch thật.</p>
        </div>
      </div>
    </div>
  );
}
