'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const VITALS = [
  ['bloodPressure', 'Huyết áp', '120/80', 'text'],
  ['temperature', 'Nhiệt độ (°C)', '37', 'number'],
  ['heartRate', 'Nhịp tim (lần/phút)', '75', 'number'],
  ['spo2', 'SpO₂ (%)', '98', 'number'],
  ['weight', 'Cân nặng (kg)', '60', 'number'],
  ['height', 'Chiều cao (cm)', '165', 'number'],
];

export default function ExamPage() {
  const router = useRouter();
  const { appointmentId } = useParams();
  const [ctx, setCtx] = useState(null);
  const [form, setForm] = useState({});
  const [labs, setLabs] = useState([]);
  const [meds, setMeds] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [rx, setRx] = useState([]); // [{medicationId, quantity, dosage}]
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [followSlots, setFollowSlots] = useState([]);
  const [followSlotId, setFollowSlotId] = useState('');
  const [followMsg, setFollowMsg] = useState('');
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const auth = { Authorization: `Bearer ${token()}` };
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    fetch('/api/lab-tests', { headers: auth }).then((r) => r.json()).then(setLabs);
    fetch('/api/medications', { headers: auth }).then((r) => r.json()).then(setMeds);
    fetch(`/api/doctor/record/${appointmentId}`, { headers: auth })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { router.push('/doctor'); return; }
        setCtx(d);
        const r = d.appt.record || {};
        setForm({
          bloodPressure: r.bloodPressure || '', temperature: r.temperature ?? '', heartRate: r.heartRate ?? '',
          spo2: r.spo2 ?? '', weight: r.weight ?? '', height: r.height ?? '',
          symptoms: r.symptoms || '', diagnosis: r.diagnosis || '', conclusion: r.conclusion || '', advice: r.advice || '',
        });
        if (d.appt.labOrder) setSelectedLabs(d.appt.labOrder.items.map((i) => i.labTestId));
        if (d.appt.prescription) setRx(d.appt.prescription.items.map((i) => ({ medicationId: i.medicationId, quantity: i.quantity, dosage: i.dosage || '' })));
        // OLD-2: nạp khung giờ trống của bác sĩ để hẹn tái khám
        fetch(`/api/doctors/${d.appt.doctorId}/slots`).then((r) => r.json()).then(setFollowSlots);
      });
  }, [appointmentId]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleLab = (id) => setSelectedLabs((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const addRx = () => setRx((r) => [...r, { medicationId: '', quantity: 1, dosage: '' }]);
  const setRxField = (i, k, v) => setRx((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const removeRx = (i) => setRx((r) => r.filter((_, idx) => idx !== i));

  const labTotal = labs.filter((t) => selectedLabs.includes(t.id)).reduce((s, t) => s + t.price, 0);
  const medTotal = rx.reduce((s, row) => {
    const m = meds.find((x) => x.id === Number(row.medicationId));
    return s + (m ? m.price * Number(row.quantity || 0) : 0);
  }, 0);
  const examFee = ctx?.appt?.doctor?.fee || 0;

  const save = async (complete) => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/doctor/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ appointmentId: parseInt(appointmentId), ...form, labTestIds: selectedLabs, prescriptionItems: rx, complete }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(d.error || 'Lỗi lưu bệnh án'); return; }
    if (complete) { router.push('/doctor'); return; }
    setMsg('Đã lưu nháp bệnh án, chỉ định & đơn thuốc.');
  };

  // OLD-4 — cảnh báo y khoa tự động (tính trực tiếp từ đơn đang kê)
  const medWarnings = (() => {
    const w = []; const seen = new Set();
    for (const row of rx) {
      const m = meds.find((x) => x.id === Number(row.medicationId)); if (!m) continue;
      if (seen.has(m.id)) w.push(`Trùng thuốc: ${m.name} xuất hiện nhiều lần`); seen.add(m.id);
      if (Number(row.quantity) > 60) w.push(`Số lượng cao bất thường: ${m.name} × ${row.quantity}`);
      if (m.stock < Number(row.quantity)) w.push(`Tồn kho không đủ: ${m.name} (tồn ${m.stock})`);
    }
    return w;
  })();

  // OLD-2 — tạo lịch tái khám
  const createFollowUp = async () => {
    setFollowMsg('');
    if (!followSlotId) { setFollowMsg('Hãy chọn khung giờ tái khám.'); return; }
    const res = await fetch('/api/doctor/follow-up', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ appointmentId: parseInt(appointmentId), slotId: Number(followSlotId), note: 'Tái khám' }),
    });
    const d = await res.json();
    if (res.ok) {
      setFollowMsg(`✓ Đã hẹn tái khám — mã ${d.code}`);
      setFollowSlots((s) => s.filter((x) => x.id !== Number(followSlotId)));
      setFollowSlotId('');
    } else setFollowMsg(d.error || 'Không tạo được lịch tái khám');
  };

  if (!ctx) return (<div><Nav /><div className="max-w-4xl mx-auto p-8 text-muted">Đang tải...</div></div>);
  const p = ctx.appt.patient;

  return (
    <div>
      <Nav />
      <div className="max-w-4xl mx-auto p-8">
        <button onClick={() => router.push('/doctor')} className="text-muted text-sm mb-4">← Về hàng chờ</button>
        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#EFECFA] flex items-center justify-center text-xl font-bold text-[#968ACD]">{p.fullName[0]}</div>
          <div>
            <div className="text-xl font-bold">{p.fullName} <span className="text-sm font-normal text-muted">· STT #{ctx.appt.queueNumber}</span></div>
            <div className="text-sm text-muted">Mã khám: {ctx.appt.code}{ctx.appt.note ? ` · Lý do: ${ctx.appt.note}` : ''}</div>
          </div>
        </div>

        {ctx.history.length > 0 && (
          <div className="bg-cream rounded-2xl p-4 mb-6">
            <div className="font-semibold text-sm mb-2">Lịch sử khám gần đây</div>
            {ctx.history.map((h) => (
              <div key={h.id} className="text-sm text-muted border-b border-[#F0E6E0] last:border-0 py-1">
                {new Date(h.createdAt).toLocaleDateString('vi-VN')} · {h.doctor.fullName}: {h.diagnosis || h.conclusion || '—'}
              </div>
            ))}
          </div>
        )}

        <h2 className="font-bold text-lg mb-3">Sinh hiệu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {VITALS.map(([k, label, ph, type]) => (
            <div key={k}>
              <label className="text-xs text-muted">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} placeholder={ph} className="w-full border border-[#F0E6E0] bg-white rounded-xl px-3 py-2 mt-1" />
            </div>
          ))}
        </div>

        <h2 className="font-bold text-lg mb-3">Chẩn đoán &amp; kết luận</h2>
        <div className="space-y-3 mb-6">
          <textarea value={form.symptoms} onChange={set('symptoms')} placeholder="Triệu chứng..." className="w-full border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" rows={2} />
          <textarea value={form.diagnosis} onChange={set('diagnosis')} placeholder="Chẩn đoán (ICD-10)..." className="w-full border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" rows={2} />
          <textarea value={form.conclusion} onChange={set('conclusion')} placeholder="Kết luận..." className="w-full border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" rows={2} />
          <textarea value={form.advice} onChange={set('advice')} placeholder="Lời dặn..." className="w-full border border-[#F0E6E0] bg-white rounded-xl px-4 py-3" rows={2} />
        </div>

        {/* M5 — Chỉ định CLS */}
        <h2 className="font-bold text-lg mb-3">Chỉ định cận lâm sàng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          {labs.map((t) => (
            <label key={t.id} className={`flex items-center justify-between border rounded-xl px-4 py-2 cursor-pointer ${selectedLabs.includes(t.id) ? 'border-coral bg-[#FFF1EE]' : 'border-[#F0E6E0] bg-white'}`}>
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={selectedLabs.includes(t.id)} onChange={() => toggleLab(t.id)} />
                <span className="text-sm">{t.name}</span>
              </span>
              <span className="text-sm text-muted">{money(t.price)}</span>
            </label>
          ))}
        </div>
        <div className="text-sm text-muted mb-6">Phí CLS: <span className="font-semibold text-ink">{money(labTotal)}</span></div>

        {/* M6 — Kê đơn thuốc */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Kê đơn thuốc</h2>
          <button onClick={addRx} className="text-sm text-coral font-semibold border border-[#F0E6E0] rounded-lg px-3 py-1.5">+ Thêm thuốc</button>
        </div>
        <div className="space-y-2 mb-2">
          {rx.length === 0 && <p className="text-muted text-sm">Chưa kê thuốc.</p>}
          {rx.map((row, i) => {
            const m = meds.find((x) => x.id === Number(row.medicationId));
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 bg-white border border-[#F0E6E0] rounded-xl p-2">
                <select value={row.medicationId} onChange={(e) => setRxField(i, 'medicationId', e.target.value)} className="flex-1 min-w-[160px] border border-[#F0E6E0] rounded-lg px-2 py-1.5 text-sm">
                  <option value="">— Chọn thuốc —</option>
                  {meds.map((x) => <option key={x.id} value={x.id}>{x.name} ({money(x.price)}/{x.unit})</option>)}
                </select>
                <input type="number" min="1" value={row.quantity} onChange={(e) => setRxField(i, 'quantity', e.target.value)} className="w-16 border border-[#F0E6E0] rounded-lg px-2 py-1.5 text-sm" />
                <input value={row.dosage} onChange={(e) => setRxField(i, 'dosage', e.target.value)} placeholder="Liều dùng (vd: 1v x 2 lần/ngày)" className="flex-1 min-w-[160px] border border-[#F0E6E0] rounded-lg px-2 py-1.5 text-sm" />
                <span className="text-sm text-muted w-20 text-right">{money(m ? m.price * Number(row.quantity || 0) : 0)}</span>
                <button onClick={() => removeRx(i)} className="text-coral text-sm px-2">✕</button>
              </div>
            );
          })}
        </div>
        <div className="text-sm text-muted mb-3">Tiền thuốc: <span className="font-semibold text-ink">{money(medTotal)}</span></div>

        {/* OLD-4 — Cảnh báo y khoa tự động */}
        {medWarnings.length > 0 && (
          <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-3 mb-6">
            <div className="font-semibold text-[#92400E] text-sm mb-1">⚠ Cảnh báo y khoa (bác sĩ xác nhận trước khi hoàn tất)</div>
            <ul className="list-disc pl-5 text-sm text-[#92400E]">
              {medWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Tổng kết hóa đơn dự kiến */}
        <div className="bg-cream rounded-2xl p-4 mb-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Phí khám</span><span>{money(examFee)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Phí CLS</span><span>{money(labTotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Tiền thuốc</span><span>{money(medTotal)}</span></div>
          <div className="flex justify-between border-t border-[#F0E6E0] mt-2 pt-2 font-bold"><span>Tổng dự kiến</span><span className="text-coral">{money(examFee + labTotal + medTotal)}</span></div>
        </div>

        {/* OLD-2 — Hẹn tái khám */}
        <div className="bg-white rounded-2xl border border-[#F0E6E0] shadow-sm p-4 mb-6">
          <h2 className="font-bold text-lg mb-2">Hẹn tái khám (tùy chọn)</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={followSlotId} onChange={(e) => setFollowSlotId(e.target.value)} className="flex-1 min-w-[200px] border border-[#F0E6E0] rounded-lg px-3 py-2 text-sm">
              <option value="">— Chọn khung giờ tái khám —</option>
              {followSlots.map((s) => (
                <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString('vi-VN')} · {s.startTime}</option>
              ))}
            </select>
            <button onClick={createFollowUp} className="border border-coral text-coral font-semibold px-4 py-2 rounded-xl text-sm">Tạo lịch tái khám</button>
          </div>
          {followMsg && <p className="text-sm mt-2 font-medium text-greenx">{followMsg}</p>}
        </div>

        {msg && <p className="text-greenx mb-3 text-sm font-medium">{msg}</p>}
        <div className="flex gap-3">
          <button disabled={saving} onClick={() => save(false)} className="border border-[#F0E6E0] text-ink font-semibold px-5 py-3 rounded-xl disabled:opacity-50">Lưu nháp</button>
          <button disabled={saving} onClick={() => save(true)} className="bg-coral text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-50">Hoàn tất khám &amp; xuất hóa đơn</button>
        </div>
      </div>
    </div>
  );
}
