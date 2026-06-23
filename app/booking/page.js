'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function BookingPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('doctorId'));
    const preSlot = parseInt(params.get('slotId'));
    setDoctorId(id);
    if (preSlot) setSlotId(preSlot);
    fetch(`/api/doctors/${id}`).then((r) => (r.ok ? r.json() : null)).then(setDoctor);
    fetch(`/api/doctors/${id}/slots`).then((r) => r.json()).then(setSlots);
  }, []);

  const book = async () => {
    setError('');
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ doctorId, slotId, note }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Đặt lịch thất bại'); return; }
    setResult(data);
  };

  if (result) {
    return (
      <div><Nav />
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-greenx text-white text-4xl flex items-center justify-center mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Đặt lịch thành công!</h1>
          <p className="text-muted mb-4">Mã đặt lịch của bạn</p>
          <div className="text-2xl font-bold text-coral mb-6">{result.code}</div>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push(`/appointments/${result.id}/ticket`)} className="bg-coral text-white font-semibold px-6 py-3 rounded-xl">Xem phiếu khám điện tử (QR)</button>
            <button onClick={() => router.push('/appointments')} className="border border-[#F0E6E0] text-ink font-semibold px-6 py-3 rounded-xl">Lịch hẹn của tôi</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div><Nav />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-1">Đặt lịch khám</h1>
        {doctor && <p className="text-muted mb-6">{doctor.fullName} · {doctor.specialty} · {doctor.fee.toLocaleString('vi-VN')}đ</p>}
        <h2 className="font-semibold mb-3">Chọn khung giờ trống</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
          {slots.map((s) => (
            <button key={s.id} onClick={() => setSlotId(s.id)}
              className={`border rounded-xl py-2 text-sm ${slotId === s.id ? 'bg-coral text-white border-coral' : 'bg-white border-[#F0E6E0]'}`}>
              {new Date(s.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}<br />{s.startTime}
            </button>
          ))}
          {slots.length === 0 && <p className="text-muted col-span-4">Bác sĩ chưa có khung giờ trống.</p>}
        </div>
        <textarea className="w-full border border-[#F0E6E0] bg-white rounded-xl px-4 py-3 mb-4" placeholder="Lý do khám / triệu chứng..." value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="text-coral mb-3">{error}</p>}
        <button disabled={!slotId} onClick={book} className="w-full bg-coral disabled:opacity-50 text-white font-semibold py-3 rounded-xl">Xác nhận đặt lịch</button>
      </div>
    </div>
  );
}
