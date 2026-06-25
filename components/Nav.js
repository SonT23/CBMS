'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { navLinks, homeForRole, ROLE_LABEL } from '@/lib/roles';

export default function Nav() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const u = localStorage.getItem('user'); if (u) setUser(JSON.parse(u));
    const tk = localStorage.getItem('token');
    if (tk) fetch('/api/notifications', { headers: { Authorization: `Bearer ${tk}` } }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setUnread(d.unread)).catch(() => {});
  }, []);
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); };
  const role = user?.role || 'PATIENT';
  const links = navLinks(role);
  const isStaff = role !== 'PATIENT';

  return (
    <nav className="bg-white border-b border-[#F0E6E0] px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href={homeForRole(role)} className="font-bold text-xl text-coral">♥ <span className="text-ink">CBMS</span></Link>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="text-muted hover:text-coral font-medium">{label}</Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/notifications" className="relative text-muted hover:text-coral" title="Thông báo">
              🔔
              {unread > 0 && <span className="absolute -top-2 -right-2 bg-coral text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unread}</span>}
            </Link>
            {isStaff && <span className="text-xs font-semibold bg-tealLight text-teal px-2 py-1 rounded-full">{ROLE_LABEL[role] || role}</span>}
            {isStaff
              ? <span className="text-sm text-muted">{user.fullName || user.email}</span>
              : <Link href="/profile" className="text-sm text-muted hover:text-coral font-medium">{user.fullName || user.email}</Link>}
            <button onClick={logout} className="text-sm text-coral font-semibold">Đăng xuất</button>
          </>
        ) : (
          <Link href="/login" className="text-coral font-semibold">Đăng nhập</Link>
        )}
      </div>
    </nav>
  );
}
