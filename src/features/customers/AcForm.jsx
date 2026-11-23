import { useState } from 'react';
import { SERVICE_TYPES } from '@/lib/constants.js';

// ---------- AC form (add + edit) ----------
export default function AcForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(() => {
    const s = { type: 'Split AC', brand: '', model: '', location_label: '', installed_on: '', last_service_at: '', next_service_due: '',
      amc_active: false, amc_interval_months: 6, notes: '', ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, v ?? ''])) };
    if (!s.amc_interval_months) s.amc_interval_months = 6;      // an AC with no reminder has null here -> the dropdown would lie
    return s;
  });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await onSave({ type: f.type || null, brand: f.brand.trim() || null, model: f.model.trim() || null, location_label: f.location_label.trim() || null,
        installed_on: f.installed_on || null, last_service_at: f.last_service_at || null, notes: f.notes.trim() || null,
        amc_active: !!f.amc_active, amc_interval_months: f.amc_active ? (Number(f.amc_interval_months) || 6) : null,
        // only sent when you changed it, so ordinary edits never reset the reminder
        ...(f.amc_active && f.next_service_due && f.next_service_due !== (initial?.next_service_due || '') ? { next_service_due: f.next_service_due } : {}) });
    } catch (x) { setMsg(x.message); }
  };
  return (
    <form onSubmit={submit} className="acform">
      <div className="grid2">
        <label>Type<select value={f.type} onChange={set('type')}>{SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Brand<input placeholder="Daikin, LG, Voltas..." value={f.brand} onChange={set('brand')} /></label>
        <label>Model<input value={f.model} onChange={set('model')} /></label>
        <label>Where in the house<input placeholder="Master bedroom" value={f.location_label} onChange={set('location_label')} /></label>
        <label>Installed on<input type="date" value={f.installed_on} onChange={set('installed_on')} /></label>
        <label>Last serviced on<input type="date" value={f.last_service_at} onChange={set('last_service_at')} /></label>
      </div>
      <div className="row amcrow">
        <label className="inline"><input type="checkbox" checked={!!f.amc_active} onChange={(e) => setF({ ...f, amc_active: e.target.checked })} /> Remind for service (AMC)</label>
        {f.amc_active && <label className="inline">every
          <select value={f.amc_interval_months} onChange={set('amc_interval_months')}>{[3, 4, 6, 12].map((m) => <option key={m} value={m}>{m} months</option>)}</select></label>}
      </div>
      {f.amc_active && <label>Next service due (leave as is to calculate automatically; change it to snooze or move the reminder)<input type="date" value={f.next_service_due} onChange={set('next_service_due')} /></label>}
      <label>Notes<input value={f.notes} onChange={set('notes')} /></label>
      {msg && <div className="err">{msg}</div>}
      <div className="row"><button className="primary">Save AC</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
