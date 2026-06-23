'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const FIELDS = [
  ['fullName', 'Họ và tên', 'text'], ['relation', 'Quan hệ (Bản thân/Con/…)', 'text'],
  ['gender', 'Giới tính', 'gender'], ['dob', 'Ngày sinh', 'date'],
  ['phone', 'SĐT', 'text'], ['cccd', 'CCCD', 'text'], ['bhyt', 'Số BHYT', 'text'],
  ['bloodType', 'Nhóm máu', 'text'], ['address', 'Địa chỉ', 'text'],
  ['allergy', 'Dị ứng', 'text'], ['medicalHistory', 'Tiền sử bệnh', 'text'],
];

export default function ProfilesPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };

  const load = async () => {
    const r = await fetch('/api/profiles', { headers: auth });
    if (r.status === 401) { router.push('/login'); return; }
    setList(await r.json());
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } load(); }, []);

  const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const create = async () => {
    setMsg('');
    const r = await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(form) });
    const d = await r.json(); setMsg(r.ok ? 'Đã thêm hồ sơ.' : (d.error || 'Lỗi')); if (r.ok) { setForm({}); load(); }
  };
  const del = async (id) => {
    if (!confirm('Xóa hồ sơ này?')) return;
    const r = await fetch(`/api/profiles/${id}`, { method: 'DELETE', headers: auth });
    const d = await r.json(); setMsg(r.ok ? 'Đã xóa.' : (d.error || 'Lỗi')); load();
  };

  const Input = ({ type, value, onChange }) => {
    if (type === 'gender') return (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm w-full">
        <option value="">—</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
      </select>
    );
    return <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-2 py-2 text-sm w-full" />;
  };

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Hồ sơ bệnh nhân</h1>
        <p className="text-muted mb-5">Quản lý hồ sơ của bạn và người thân (đặt khám hộ)</p>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}

        <div className="space-y-3 mb-6">
          {list.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 flex items-start justify-between">
              <div>
                <div className="font-bold">{p.fullName} {p.relation && <span className="text-xs font-normal bg-tealLight text-teal px-2 py-0.5 rounded-full">{p.relation}</span>}</div>
                <div className="text-sm text-muted mt-1">
                  {p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : p.gender || ''}{p.dob ? ` · ${fmtDate(p.dob)}` : ''}{p.phone ? ` · ${p.phone}` : ''}
                  {p.bhyt ? ` · BHYT ${p.bhyt}` : ''}{p.bloodType ? ` · Nhóm máu ${p.bloodType}` : ''}
                </div>
                {(p.allergy || p.medicalHistory) && <div className="text-xs text-coral mt-1">{p.allergy ? `Dị ứng: ${p.allergy}. ` : ''}{p.medicalHistory ? `Tiền sử: ${p.medicalHistory}` : ''}</div>}
              </div>
              <button onClick={() => del(p.id)} className="text-coral text-sm font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">Xóa</button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4">
          <h2 className="font-bold mb-3">Thêm hồ sơ mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map(([key, label, type]) => (
              <div key={key}>
                <label className="text-xs text-muted">{label}</label>
                <Input type={type} value={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
              </div>
            ))}
          </div>
          <button onClick={create} className="mt-3 bg-coral text-white font-semibold px-5 py-2.5 rounded-xl text-sm">Thêm hồ sơ</button>
        </div>
      </div>
    </div>
  );
}
