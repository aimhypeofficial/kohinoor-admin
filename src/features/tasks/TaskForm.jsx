import { useEffect, useState } from 'react';
import { api } from '@/lib/api.js';
import { toLocalInput, fromLocalInput } from '@/lib/format.js';
import { BRAND } from '@/config/brand.js';

const EMPTY = { title: '', customer_name: '', customer_email: '', customer_phone: '', address: '', description: '',
  priority: 'normal', scheduled_at: '', assigned_to: '', ac_id: '' };

// ---------- create / edit form (same component for both) ----------
export default function TaskForm({ initial, employees, customers, onSaved, onCancel }) {
  const editing = !!initial?.id;
  const [f, setF] = useState(() => (editing ? { ...EMPTY, ...initial, customer_phone: initial.customer_phone || '', description: initial.description || '',
    scheduled_at: toLocalInput(initial.scheduled_at), assigned_to: initial.assigned_to || '', ac_id: initial.ac_id || '' } : EMPTY));
  const [pick, setPick] = useState('');
  const [acs, setAcs] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const label = (c) => `${c.name} · ${c.phone || c.email || ''}`;
  const customerId = initial?.customer_ref || customers.find((c) => label(c) === pick)?.id;

  useEffect(() => {
    if (!customerId) { setAcs([]); return; }
    api(`/api/customers/${customerId}`).then((d) => setAcs(d.acs || [])).catch(() => setAcs([]));
  }, [customerId]);

  const choose = (v) => {
    setPick(v);
    const c = customers.find((x) => label(x) === v);
    if (c) setF((s) => ({ ...s, customer_name: c.name, customer_email: c.email || s.customer_email, customer_phone: c.phone || '', address: c.address || s.address, ac_id: '' }));
  };
  const chooseAc = (id) => {
    const a = acs.find((x) => x.id === id);
    setF((s) => ({ ...s, ac_id: id, title: s.title || (a ? `${a.type || 'AC'} service` : s.title) }));
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      const email = f.customer_email.trim();
      if (!email && f.customer_phone.replace(/\D/g, '').length < 10) throw new Error('Enter a 10-digit phone number or an email, so the customer can receive the completion code.');
      const body = { title: f.title.trim(), customer_name: f.customer_name.trim(),
        address: f.address.trim(), priority: f.priority };
      if (editing) {
        Object.assign(body, { customer_email: email || null, customer_phone: f.customer_phone.trim() || null, description: f.description.trim() || null,
          scheduled_at: fromLocalInput(f.scheduled_at), ac_id: f.ac_id || null });
        if (initial.status === 'completed') throw new Error('Use the Details screen to change billing on a completed task.');
        await api(`/api/tasks/${initial.id}`, 'PATCH', body);
      } else {
        if (email) body.customer_email = email;
        if (f.customer_phone.trim()) body.customer_phone = f.customer_phone.trim();
        if (f.description.trim()) body.description = f.description.trim();
        if (f.scheduled_at) body.scheduled_at = fromLocalInput(f.scheduled_at);
        if (f.assigned_to) body.assigned_to = f.assigned_to;
        if (f.ac_id) body.ac_id = f.ac_id;
        await api('/api/tasks', 'POST', body);
      }
      onSaved();
    } catch (x) { setMsg(x.message); } finally { setBusy(false); }
  };

  return (
    <form className="card taskform" onSubmit={submit}>
      <h3>{editing ? 'Edit task' : 'New task'}</h3>
      {!editing && (
        <label>Existing customer (optional)
          <input list="custlist" placeholder="Start typing a name or phone..." value={pick} onChange={(e) => choose(e.target.value)} />
          <datalist id="custlist">{customers.map((c) => <option key={c.id} value={label(c)} />)}</datalist>
        </label>
      )}
      <div className="grid2">
        <label>Service<input placeholder="e.g. Split AC service" list="svc" required value={f.title} onChange={set('title')} />
          <datalist id="svc">{BRAND.services.map((s) => <option key={s} value={s} />)}</datalist></label>
        <label>Priority<select value={f.priority} onChange={set('priority')}><option>low</option><option>normal</option><option>high</option></select></label>
        <label>Customer name<input required value={f.customer_name} onChange={set('customer_name')} /></label>
        <label>Customer phone<input type="tel" placeholder="98xxxxxxxx" value={f.customer_phone} onChange={set('customer_phone')} /></label>
        <label>Customer email (optional)<input type="email" placeholder="only needed if no phone" value={f.customer_email} onChange={set('customer_email')} /></label>
        <label>Schedule date &amp; time<input type="datetime-local" value={f.scheduled_at} onChange={set('scheduled_at')} /></label>
      </div>
      <label>Address<input required value={f.address} onChange={set('address')} /></label>
      {acs.length > 0 && (
        <label>Which AC? (links this job to the AC history)
          <select value={f.ac_id} onChange={(e) => chooseAc(e.target.value)}>
            <option value="">Not linked</option>
            {acs.map((a) => <option key={a.id} value={a.id}>{[a.type, a.brand, a.model].filter(Boolean).join(' ') || 'AC'}{a.location_label ? ` - ${a.location_label}` : ''}</option>)}
          </select>
        </label>
      )}
      <label>Details for the technician<input value={f.description} onChange={set('description')} /></label>
      {!editing && (
        <label>Assign now (optional)
          <select value={f.assigned_to} onChange={set('assigned_to')}>
            <option value="">Assign later</option>
            {employees.filter((e) => e.status === 'active').map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </label>
      )}
      {/[\u0900-\u097F]/.test(`${f.customer_name} ${f.address}`) && <div className="warnbox">The PDF service report cannot print Hindi letters (they show as ?). Please type the name and address in English letters.</div>}
      <small>The 6-digit completion code is sent to the customer on WhatsApp (if set up) or by email, so give at least a phone number or an email.</small>
      {msg && <div className="err">{msg}</div>}
      <div className="row">
        <button className="primary" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create task'}</button>
        {onCancel && <button type="button" onClick={onCancel}>Close</button>}
      </div>
    </form>
  );
}
