'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setMe(d); setLoading(false); });
  }, []);

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-3 border-b border-[#F0E6E0] last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Hồ sơ cá nhân</h1>
        {loading && <p className="text-muted">Đang tải...</p>}
        {!loading && !me && <p className="text-coral">Không tải được hồ sơ.</p>}
        {me && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#EFECFA] flex items-center justify-center text-2xl font-bold text-[#968ACD]">
                {(me.fullName || me.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xl font-bold">{me.fullName || 'Bệnh nhân'}</div>
                <div className="text-muted text-sm">{me.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                ['Tổng lịch hẹn', me.stats.total, 'text-ink'],
                ['Đang hiệu lực', me.stats.upcoming, 'text-greenx'],
                ['Đã hủy', me.stats.cancelled, 'text-coral'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 text-center">
                  <div className={`text-3xl font-bold ${color}`}>{val}</div>
                  <div className="text-xs text-muted mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-6 mb-6">
              <h2 className="font-bold mb-2">Thông tin tài khoản</h2>
              <Row label="Họ và tên" value={me.fullName} />
              <Row label="Email" value={me.email} />
              <Row label="Số điện thoại" value={me.phone} />
              <Row label="Vai trò" value={me.role === 'PATIENT' ? 'Bệnh nhân' : me.role} />
              <Row label="Trạng thái" value={me.status === 'ACTIVE' ? 'Đang hoạt động' : me.status} />
              <Row label="Ngày tạo" value={me.createdAt ? new Date(me.createdAt).toLocaleDateString('vi-VN') : ''} />
            </div>

            <button onClick={() => router.push('/appointments')}
              className="bg-coral text-white font-semibold px-6 py-3 rounded-xl">Xem lịch hẹn của tôi</button>
          </>
        )}
      </div>
    </div>
  );
}
