'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  useEffect(() => { const u = localStorage.getItem('user'); if (u) setUser(JSON.parse(u)); }, []);
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); };
  return (
    <nav className="bg-white border-b border-[#F0E6E0] px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/doctors" className="font-bold text-xl text-coral">♥ <span className="text-ink">CBMS</span></Link>
        <Link href="/doctors" className="text-muted hover:text-coral font-medium">Tìm bác sĩ</Link>
        <Link href="/appointments" className="text-muted hover:text-coral font-medium">Lịch hẹn của tôi</Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-muted">{user.fullName || user.email}</span>
            <button onClick={logout} className="text-sm text-coral font-semibold">Đăng xuất</button>
          </>
        ) : (
          <Link href="/login" className="text-coral font-semibold">Đăng nhập</Link>
        )}
      </div>
    </nav>
  );
}
