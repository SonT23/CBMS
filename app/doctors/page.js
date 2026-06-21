'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState('');

  const load = async () => {
    const res = await fetch('/api/doctors' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    setDoctors(await res.json());
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Tìm bác sĩ phù hợp với bạn</h1>
        <p className="text-muted mb-6">Chọn bác sĩ để đặt lịch khám</p>
        <div className="flex gap-3 mb-8">
          <input className="flex-1 border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" placeholder="Tìm theo tên bác sĩ..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={load} className="bg-coral text-white font-semibold px-6 rounded-xl">Tìm kiếm</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctors.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#EFECFA] flex items-center justify-center font-bold text-[#968ACD]">
                  {d.fullName.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <div className="font-bold">{d.fullName}</div>
                  <span className="inline-block bg-tealLight text-teal text-xs px-2 py-0.5 rounded-full mt-1">{d.specialty}</span>
                </div>
              </div>
              <div className="text-sm text-gold mb-3">★ {d.rating} · {d.experience} năm KN</div>
              <div className="flex items-center justify-between border-t border-[#F0E6E0] pt-3">
                <div>
                  <div className="text-xs text-muted">Phí khám</div>
                  <div className="font-bold text-coral">{d.fee.toLocaleString('vi-VN')}đ</div>
                </div>
                <button onClick={() => router.push(`/booking?doctorId=${d.id}`)} className="bg-coral text-white font-semibold px-4 py-2 rounded-xl">Đặt lịch</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
