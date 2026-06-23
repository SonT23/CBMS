'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (spec) params.set('specialty', spec);
    const res = await fetch('/api/doctors' + (params.toString() ? `?${params}` : ''));
    setDoctors(await res.json());
    setLoading(false);
  };
  useEffect(() => {
    fetch('/api/specialties').then((r) => r.json()).then(setSpecialties);
    load();
  }, []);
  useEffect(() => { load(); }, [spec]);

  return (
    <div>
      <Nav />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Tìm bác sĩ phù hợp với bạn</h1>
        <p className="text-muted mb-6">Chọn bác sĩ để xem chi tiết và đặt lịch khám</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input className="flex-1 border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" placeholder="Tìm theo tên bác sĩ..."
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <button onClick={load} className="bg-coral text-white font-semibold px-6 py-3 rounded-xl">Tìm kiếm</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSpec('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${spec === '' ? 'bg-coral text-white border-coral' : 'bg-white text-muted border-[#F0E6E0]'}`}>
            Tất cả
          </button>
          {specialties.map((s) => (
            <button key={s.id} onClick={() => setSpec(s.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border ${spec === s.name ? 'bg-coral text-white border-coral' : 'bg-white text-muted border-[#F0E6E0]'}`}>
              {s.name}
            </button>
          ))}
        </div>
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && doctors.length === 0 && <p className="text-muted">Không tìm thấy bác sĩ phù hợp.</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctors.map((d) => (
            <div key={d.id} onClick={() => router.push(`/doctors/${d.id}`)}
              className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 cursor-pointer hover:shadow-md transition">
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
                <button onClick={(e) => { e.stopPropagation(); router.push(`/booking?doctorId=${d.id}`); }}
                  className="bg-coral text-white font-semibold px-4 py-2 rounded-xl">Đặt lịch</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
