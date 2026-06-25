'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// FN-07 — Hóa đơn điện tử (in / lưu PDF qua trình duyệt).
export default function InvoicePage() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [err, setErr] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(async (r) => { if (!r.ok) { setErr((await r.json()).error || 'Lỗi'); return null; } return r.json(); })
      .then((d) => d && setInv(d));
  }, [id]);

  if (err) return <div className="p-8 text-coral">{err}</div>;
  if (!inv) return <div className="p-8 text-muted">Đang tải...</div>;
  const a = inv.appointment;
  const lab = a.labOrder?.items || [];
  const rx = a.prescription?.items || [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between mb-3 no-print">
        <button onClick={() => history.back()} className="text-muted text-sm">← Quay lại</button>
        <button onClick={() => window.print()} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">In / Lưu PDF</button>
      </div>
      <div className="border border-black rounded-lg p-6">
        <div className="text-center mb-3">
          <div className="font-bold text-lg">HÓA ĐƠN ĐIỆN TỬ — PHÒNG KHÁM CBMS</div>
          <div className="text-sm">{inv.eInvoiceCode ? `Mã HĐĐT: ${inv.eInvoiceCode}` : `Mã hóa đơn: ${inv.code}`}</div>
        </div>
        <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-1 mb-3">
          <div><b>Bệnh nhân:</b> {inv.patient.fullName}</div>
          <div><b>Bác sĩ:</b> {a.doctor.fullName}</div>
          <div><b>Chuyên khoa:</b> {a.doctor.specialty.name}</div>
          <div><b>Ngày khám:</b> {a.slot ? new Date(a.slot.date).toLocaleDateString('vi-VN') : ''}</div>
          <div><b>Trạng thái:</b> {inv.status === 'PAID' ? 'Đã thanh toán' : inv.status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}</div>
          <div><b>Hình thức:</b> {inv.method === 'ONLINE' ? 'Trực tuyến' : inv.method === 'CASH' ? 'Tiền mặt' : '—'}</div>
        </div>
        <table className="w-full text-sm border-t border-black">
          <thead><tr className="border-b border-black"><th className="text-left py-1">Khoản mục</th><th className="text-right">Thành tiền</th></tr></thead>
          <tbody>
            <tr className="border-b border-dashed border-gray-400"><td className="py-1">Phí khám ({a.doctor.specialty.name})</td><td className="text-right">{money(inv.examFee)}</td></tr>
            {lab.length > 0 && <tr className="border-b border-dashed border-gray-400"><td className="py-1">Cận lâm sàng: {lab.map((i) => i.testName).join(', ')}</td><td className="text-right">{money(inv.labFee)}</td></tr>}
            {rx.length > 0 && <tr className="border-b border-dashed border-gray-400"><td className="py-1">Thuốc: {rx.map((i) => `${i.medName}×${i.quantity}`).join(', ')}</td><td className="text-right">{money(inv.medFee)}</td></tr>}
          </tbody>
          <tfoot><tr className="border-t border-black font-bold"><td className="py-1">TỔNG CỘNG</td><td className="text-right">{money(inv.totalAmount)}</td></tr></tfoot>
        </table>
        <div className="text-xs mt-4 text-right italic">Ngày xuất: {new Date().toLocaleString('vi-VN')}</div>
      </div>
      <style jsx global>{`@media print { .no-print { display: none } }`}</style>
    </div>
  );
}
