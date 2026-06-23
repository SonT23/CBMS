'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// OLD-5 / ITS-46 — Tem hướng dẫn sử dụng thuốc (in được).
export default function LabelPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(() => {
    fetch(`/api/pharmacy/prescription/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => (r.ok ? r.json() : null)).then(setP);
  }, [id]);

  if (!p) return <div className="p-8 text-muted">Đang tải...</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => window.print()} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl text-sm">In tem</button>
      </div>
      <div className="border-2 border-black rounded-lg p-4">
        <div className="text-center font-bold border-b border-black pb-2 mb-2">PHÒNG KHÁM CBMS — TEM HƯỚNG DẪN DÙNG THUỐC</div>
        <div className="text-sm mb-1"><b>Bệnh nhân:</b> {p.patient.fullName}</div>
        <div className="text-sm mb-1"><b>Bác sĩ kê:</b> {p.doctor.fullName}</div>
        <div className="text-sm mb-2"><b>Mã đơn:</b> {p.code}</div>
        <table className="w-full text-sm border-t border-black">
          <thead><tr className="border-b border-black"><th className="text-left py-1">Thuốc</th><th className="text-center">SL</th><th className="text-left">Cách dùng</th></tr></thead>
          <tbody>
            {p.items.map((it) => (
              <tr key={it.id} className="border-b border-dashed border-gray-400">
                <td className="py-1">{it.medName}</td>
                <td className="text-center">{it.quantity} {it.medication.unit}</td>
                <td>{it.dosage || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs mt-3 italic">Uống thuốc theo đúng hướng dẫn. Đọc kỹ trước khi dùng. Để xa tầm tay trẻ em.</div>
      </div>
      <style jsx global>{`@media print { .no-print { display: none } }`}</style>
    </div>
  );
}
