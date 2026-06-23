'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const TABS = [
  ['specialties', 'Chuyên khoa', [['name', 'Tên chuyên khoa', 'text']]],
  ['doctors', 'Bác sĩ', [['fullName', 'Họ tên', 'text'], ['specialtyId', 'Chuyên khoa', 'specialty'], ['fee', 'Phí khám', 'num'], ['experience', 'Năm KN', 'num']]],
  ['services', 'Dịch vụ CLS', [['name', 'Tên dịch vụ', 'text'], ['price', 'Giá', 'num']]],
  ['medications', 'Thuốc', [['name', 'Tên thuốc', 'text'], ['unit', 'ĐV', 'text'], ['price', 'Giá', 'num'], ['stock', 'Tồn', 'num'], ['reorderLevel', 'Ngưỡng', 'num']]],
];

export default function AdminCatalog() {
  const router = useRouter();
  const [tab, setTab] = useState('specialties');
  const [rows, setRows] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [form, setForm] = useState({});
  const [edits, setEdits] = useState({});
  const [msg, setMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };
  const cols = TABS.find((t) => t[0] === tab)[2];

  const load = async (res) => {
    const r = await fetch(`/api/admin/${res}`, { headers: auth });
    if (r.status === 403) { router.push('/login'); return; }
    setRows(await r.json());
  };
  useEffect(() => { if (!token()) { router.push('/login'); return; } fetch('/api/specialties').then((r) => r.json()).then(setSpecs); }, []);
  useEffect(() => { setForm({}); setEdits({}); load(tab); }, [tab]);

  const specName = (id) => specs.find((s) => s.id === id)?.name || id;
  const create = async () => {
    setMsg('');
    const r = await fetch(`/api/admin/${tab}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(form) });
    const d = await r.json(); setMsg(r.ok ? 'Đã thêm.' : (d.error || 'Lỗi')); if (r.ok) { setForm({}); load(tab); }
  };
  const save = async (id) => {
    const r = await fetch(`/api/admin/${tab}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(edits[id] || {}) });
    const d = await r.json(); setMsg(r.ok ? 'Đã lưu.' : (d.error || 'Lỗi')); load(tab);
  };
  const del = async (id) => {
    if (!confirm('Xóa mục này?')) return;
    const r = await fetch(`/api/admin/${tab}/${id}`, { method: 'DELETE', headers: auth });
    const d = await r.json(); setMsg(r.ok ? 'Đã xóa.' : (d.error || 'Lỗi')); load(tab);
  };
  const setEdit = (id, key, val) => setEdits((e) => ({ ...e, [id]: { ...e[id], [key]: val } }));

  const Field = ({ type, value, onChange }) => {
    if (type === 'specialty') return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-2 py-1 text-sm w-full">
        <option value="">—</option>{specs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    );
    return <input type={type === 'num' ? 'number' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="border border-[#F0E6E0] rounded-lg px-2 py-1 text-sm w-full" />;
  };

  return (
    <div>
      <Nav />
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-1">Danh mục &amp; bảng giá</h1>
        <p className="text-muted mb-5">Quản lý chuyên khoa, bác sĩ, dịch vụ cận lâm sàng, thuốc</p>
        <div className="flex flex-wrap bg-cream rounded-xl p-1 mb-5 w-fit">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${tab === k ? 'bg-white text-coral shadow-sm' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
        {msg && <div className="mb-4 bg-[#E6F4EC] text-greenx px-4 py-2 rounded-xl text-sm font-medium">{msg}</div>}

        {/* Thêm mới */}
        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-5">
          <div className="font-semibold mb-2 text-sm">Thêm mới</div>
          <div className="flex flex-wrap gap-2 items-center">
            {cols.map(([key, label, type]) => (
              <div key={key} className="flex-1 min-w-[140px]">
                <label className="text-xs text-muted">{label}</label>
                <Field type={type} value={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
              </div>
            ))}
            <button onClick={create} className="bg-coral text-white font-semibold rounded-xl px-4 py-2 text-sm self-end">Thêm</button>
          </div>
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-muted"><tr>{cols.map(([k, l]) => <th key={k} className="text-left px-3 py-2">{l}</th>)}<th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#F0E6E0]">
                  {cols.map(([key, label, type]) => (
                    <td key={key} className="px-3 py-2">
                      <Field type={type} value={edits[row.id]?.[key] ?? row[key]} onChange={(v) => setEdit(row.id, key, v)} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => save(row.id)} className="text-greenx font-semibold border border-[#F0E6E0] rounded-lg px-2 py-1 text-xs mr-1">Lưu</button>
                    <button onClick={() => del(row.id)} className="text-coral font-semibold border border-[#F0E6E0] rounded-lg px-2 py-1 text-xs">Xóa</button>
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
