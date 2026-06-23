'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { ROLE_LABEL } from '@/lib/roles';

const ROLES = ['RECEPTIONIST', 'DOCTOR', 'LAB_TECH', 'PHARMACIST', 'CASHIER', 'ADMIN'];

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', role: 'RECEPTIONIST', password: 'Abc@1234' });
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    const res = await fetch('/api/admin/users', { headers: auth });
    if (res.status === 403) { router.push('/login'); return; }
    setUsers(await res.json());
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const create = async () => {
    setMsg('');
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(form) });
    const d = await res.json();
    setMsg(res.ok ? `Đã tạo ${d.email}` : (d.error || 'Lỗi'));
    if (res.ok) { setForm({ email: '', role: 'RECEPTIONIST', password: 'Abc@1234' }); load(); }
  };
  const patch = async (id, body) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(body) });
    const d = await res.json(); if (!res.ok) setMsg(d.error || 'Lỗi'); load();
  };

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Quản lý nhân viên</h1>
        <p className="text-muted mb-6">Tạo tài khoản, phân quyền, khóa/mở</p>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-6">
          <h2 className="font-bold mb-3">Tạo tài khoản mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mật khẩu" className="border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm" />
            <button onClick={create} className="bg-coral text-white font-semibold rounded-xl px-4 py-2 text-sm">Tạo</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream text-muted"><tr><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Vai trò</th><th className="text-left px-4 py-2">Trạng thái</th><th className="text-right px-4 py-2">Thao tác</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#F0E6E0]">
                  <td className="px-4 py-2 font-medium">{u.email}{u.doctor ? ` (${u.doctor})` : ''}</td>
                  <td className="px-4 py-2">
                    <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} className="border border-[#F0E6E0] rounded-lg px-2 py-1 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.status === 'ACTIVE' ? 'bg-[#E6F4EC] text-greenx' : 'bg-[#FCE8E6] text-coral'}`}>{u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => patch(u.id, { status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' })} className="text-coral font-semibold border border-[#F0E6E0] rounded-lg px-2 py-1 text-xs">
                      {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
