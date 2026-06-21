'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Có lỗi xảy ra'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/doctors');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#F0E6E0] shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-1">Chào mừng đến CBMS</h1>
        <p className="text-muted text-center mb-6">Đặt lịch khám nhanh chóng</p>
        <div className="flex bg-cream rounded-xl p-1 mb-6">
          {['login', 'register'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-semibold ${tab === t ? 'bg-white text-coral shadow-sm' : 'text-muted'}`}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {tab === 'register' && (
            <>
              <input className="w-full border border-[#F0E6E0] bg-cream rounded-xl px-4 py-3" placeholder="Họ và tên" value={form.fullName} onChange={set('fullName')} required />
              <input className="w-full border border-[#F0E6E0] bg-cream rounded-xl px-4 py-3" placeholder="Số điện thoại" value={form.phone} onChange={set('phone')} />
            </>
          )}
          <input type="email" className="w-full border border-[#F0E6E0] bg-cream rounded-xl px-4 py-3" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input type="password" className="w-full border border-[#F0E6E0] bg-cream rounded-xl px-4 py-3" placeholder="Mật khẩu" value={form.password} onChange={set('password')} required />
          {error && <p className="text-coral text-sm">{error}</p>}
          <button className="w-full bg-coral hover:bg-coralDark text-white font-semibold py-3 rounded-xl">
            {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
