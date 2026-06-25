'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    const r = await fetch('/api/notifications', { headers: auth });
    if (r.status === 401) { router.push('/login'); return; }
    setItems((await r.json()).items);
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const open = async (n) => {
    if (!n.isRead) await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH', headers: auth });
    if (n.link) router.push(n.link); else load();
  };
  const readAll = async () => { await fetch('/api/notifications/read-all', { method: 'POST', headers: auth }); load(); };

  return (
    <div>
      <Nav />
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Thông báo</h1>
          <button onClick={readAll} className="text-sm text-coral font-semibold">Đánh dấu đã đọc tất cả</button>
        </div>
        {items.length === 0 && <p className="text-muted">Không có thông báo.</p>}
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} onClick={() => open(n)}
              className={`rounded-2xl border border-[#F0E6E0] shadow-sm p-4 cursor-pointer hover:shadow-md transition ${n.isRead ? 'bg-cream' : 'bg-white'}`}>
              <div className="flex items-center gap-2">
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-coral" />}
                <span className="font-bold">{n.title}</span>
                <span className="text-xs text-muted ml-auto">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              {n.body && <div className="text-sm text-muted mt-1">{n.body}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
