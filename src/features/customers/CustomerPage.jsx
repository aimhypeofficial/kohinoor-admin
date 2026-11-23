import { useEffect, useState } from 'react';
import { api } from '@/lib/api.js';
import { fmt, fmtDay, inr } from '@/lib/format.js';
import { telHref, waHref } from '@/lib/links.js';
import { Ask } from '@/components';
import { reminderText, reminderOk } from '@/features/amc/reminder.js';
import { acName } from './acName.js';
import AcForm from './AcForm.jsx';
import BookModal from './BookModal.jsx';

// ---------- one customer ----------
export default function CustomerPage({ id, employees, role, onBack }) {
  const [d, setD] = useState(null);
  const [edit, setEdit] = useState(null);       // customer fields being edited
  const [acForm, setAcForm] = useState(null);   // 'new' | ac object
  const [book, setBook] = useState(null);
  const [ask, setAsk] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const say = (type, text) => setMsg({ type, text });
  const load = () => api(`/api/customers/${id}`).then(setD).catch((e) => say('err', e.message));
  useEffect(() => { load(); }, [id]);
  if (!d) return <>{msg.text ? <div className="err">{msg.text}</div> : 'Loading...'}</>;
  const c = d.customer;
  const run = async (fn, ok) => { try { await fn(); if (ok) say('ok', ok); load(); } catch (e) { say('err', e.message); } };
  const saveCustomer = () => run(async () => {
    await api(`/api/customers/${id}`, 'PATCH', { name: edit.name.trim(), email: edit.email.trim() || null, phone: edit.phone.trim() || null,
      address: edit.address.trim() || null, notes: edit.notes.trim() || null });
    setEdit(null);
  }, 'Saved.');
  const remind = async (a) => {
    setReminding(a.id);
    try { const r = await api(`/api/acs/${a.id}/remind`, 'POST'); say(reminderOk(r) ? 'ok' : 'err', reminderText(r)); load(); }
    catch (e) { say('err', e.message); } finally { setReminding(null); }
  };
  const nameOf = (eid) => employees.find((e) => e.id === eid)?.full_name || '-';

  return (
    <>
      <button className="linkbtn" onClick={onBack}>← All customers</button>
      <div className="head"><h2>{c.name}</h2><span className="meta">{d.service_count} completed service{d.service_count === 1 ? '' : 's'}</span></div>
      {msg.text && <div className={msg.type}>{msg.text}</div>}

      <div className="card">
        {edit ? (
          <div className="grid2">
            {['name', 'phone', 'email', 'address', 'notes'].map((k) => (
              <label key={k}>{k[0].toUpperCase() + k.slice(1)}<input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>
            ))}
            <div className="row"><button className="primary" onClick={saveCustomer}>Save</button><button onClick={() => setEdit(null)}>Cancel</button></div>
          </div>
        ) : (
          <div className="row between">
            <div>
              <div>{c.phone || 'No phone'} · {c.email || 'No email'}</div>
              <small>{c.address || 'No address'}</small>{c.notes && <small>Note: {c.notes}</small>}
              <div className="links">{telHref(c.phone) && <a href={telHref(c.phone)}>Call</a>}{waHref(c.phone) && <a href={waHref(c.phone)} target="_blank" rel="noreferrer">WhatsApp</a>}
                {c.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`} target="_blank" rel="noreferrer">Map</a>}</div>
            </div>
            <button onClick={() => setEdit({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' })}>Edit</button>
          </div>
        )}
      </div>

      <div className="head"><h3>Air conditioners ({d.acs.length})</h3><button onClick={() => setAcForm('new')}>+ Add AC</button></div>
      {acForm === 'new' && <div className="card"><AcForm onCancel={() => setAcForm(null)}
        onSave={async (b) => { await api(`/api/customers/${id}/acs`, 'POST', b); setAcForm(null); load(); }} /></div>}
      {d.acs.length === 0 && acForm !== 'new' && <div className="empty card">No AC saved yet. Add the customer’s AC to track service history and send reminders.</div>}
      {d.acs.map((a) => (
        <div className="card ac" key={a.id}>
          {acForm?.id === a.id ? (
            <AcForm initial={a} onCancel={() => setAcForm(null)}
              onSave={async (b) => { await api(`/api/acs/${a.id}`, 'PATCH', b); setAcForm(null); load(); }} />
          ) : (
            <div className="row between">
              <div>
                <b>{acName(a)}</b>{a.location_label && <span> · {a.location_label}</span>}
                <small>Serviced <b>{a.service_count}</b> time{a.service_count === 1 ? '' : 's'} here · Last service {fmtDay(a.last_service_at)} · Installed {fmtDay(a.installed_on)}</small>
                <small>{a.amc_active ? `Reminder every ${a.amc_interval_months} months · next due ${fmtDay(a.next_service_due)}` : 'No service reminder'}</small>
                {a.notes && <small>{a.notes}</small>}
              </div>
              <div className="actions">
                <button className="primary" onClick={() => setBook(a)}>Book service</button>
                {a.amc_active && <button disabled={reminding === a.id} onClick={() => remind(a)}>{reminding === a.id ? 'Sending...' : 'Remind'}</button>}
                <button onClick={() => setAcForm(a)}>Edit</button>
                {role === 'admin' && <button className="danger" onClick={() => setAsk({ title: `Delete ${acName(a)}?`, text: 'Past jobs are kept.', confirmText: 'Delete', danger: true, onConfirm: () => api(`/api/acs/${a.id}`, 'DELETE').then(() => load()) })}>Delete</button>}
              </div>
            </div>
          )}
        </div>
      ))}

      <h3>Service history</h3>
      <table>
        <thead><tr><th>Date</th><th>Service</th><th>AC</th><th>Technician</th><th>Status</th><th>Bill</th></tr></thead>
        <tbody>
          {d.tasks.length === 0 && <tr><td colSpan="6" className="empty">No jobs yet.</td></tr>}
          {d.tasks.map((t) => (
            <tr key={t.id}>
              <td>{fmt(t.completed_at || t.scheduled_at || t.created_at)}</td><td>{t.title}{t.notes && <small>{t.notes}</small>}</td>
              <td>{t.ac_id ? acName(d.acs.find((a) => a.id === t.ac_id) || {}) : '-'}</td><td>{nameOf(t.assigned_to)}</td>
              <td><span className={`pill ${t.status}`}>{t.status.replace('_', ' ')}</span></td><td>{t.amount != null ? `${inr(t.amount)} · ${t.payment_status}` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ask && <Ask {...ask} onClose={() => setAsk(null)} />}
      {book && <BookModal ac={book} employees={employees} onClose={() => setBook(null)} onDone={() => { setBook(null); say('ok', 'Task created. Find it in Tasks to assign.'); load(); }} />}
    </>
  );
}
