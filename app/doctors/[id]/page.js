'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function DoctorDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/doctors/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/doctors/${id}/slots`).then((r) => r.json()),
    ]).then(([d, s]) => { setDoctor(d); setSlots(s); setLoading(false); });
  }, [id]);

  // group slots by date
  const byDate = slots.reduce((acc, s) => {
    const key = new Date(s.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <button onClick={() => router.push('/doctors')} className="text-muted text-sm mb-4">← Quay lại danh sách</button>
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && !doctor && <p className="text-coral">Không tìm thấy bác sĩ.</p>}
        {doctor && (
          <>
            <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-6 mb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-[#EFECFA] flex items-center justify-center text-3xl font-bold text-[#968ACD]">
                  {doctor.fullName.split(' ').slice(-1)[0][0]}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{doctor.fullName}</h1>
                  <span className="inline-block bg-tealLight text-teal text-xs px-2 py-0.5 rounded-full mt-1">{doctor.specialty}</span>
                  <div className="text-sm text-gold mt-2">★ {doctor.rating} · {doctor.experience} năm kinh nghiệm</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Phí khám</div>
                  <div className="text-xl font-bold text-coral">{doctor.fee.toLocaleString('vi-VN')}đ</div>
                </div>
              </div>
            </div>

            <h2 className="font-bold text-lg mb-3">Khung giờ còn trống</h2>
            {Object.keys(byDate).length === 0 && (
              <p className="text-muted">Bác sĩ hiện chưa có khung giờ trống sắp tới.</p>
            )}
            <div className="space-y-5">
              {Object.entries(byDate).map(([day, list]) => (
                <div key={day}>
                  <div className="font-semibold text-ink mb-2 capitalize">{day}</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {list.map((s) => (
                      <button key={s.id}
                        onClick={() => router.push(`/booking?doctorId=${doctor.id}&slotId=${s.id}`)}
                        className="border border-[#F0E6E0] bg-white rounded-xl py-2 text-sm hover:border-coral hover:text-coral font-medium">
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => router.push(`/booking?doctorId=${doctor.id}`)}
              className="mt-8 bg-coral text-white font-semibold px-6 py-3 rounded-xl">Đặt lịch với bác sĩ này</button>
          </>
        )}
      </div>
    </div>
  );
}
