import { useEffect, useRef, useState } from 'react';
import { sb } from '@/lib/supabase.js';
import { api, qs } from '@/lib/api.js';
import { fmt, localDay, inr } from '@/lib/format.js';
import { telHref, waHref, mapHref } from '@/lib/links.js';
import { STATUSES } from '@/lib/constants.js';
import { useT } from '@/i18n';
import { Modal, Ask, Tl } from '@/components';
import TaskForm from './TaskForm.jsx';
import TaskDetails from './TaskDetails.jsx';

// ---------- main screen ----------
export default function Tasks({ employees }) {
  const [t] = useT();
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fl, setFl] = useState({ q: '', status: '', employee: '', date_by: 'created', from: '', to: '' });
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [ask, setAsk] = useState(null);
  const flRef = useRef(fl);
  flRef.current = fl;

  const load = () => {
    const f = flRef.current;
    const to = f.to ? new Date(new Date(`${f.to}T00:00:00`).getTime() + 86400000).toISOString() : '';
    api(`/api/tasks${qs({ q: f.q.trim(), status: f.status, employee: f.employee, date_by: f.date_by,
      from: f.from ? new Date(`${f.from}T00:00:00`).toISOString() : '', to })}`)
      .then((d) => { setTasks(d); setMsg(''); setLoaded(true); }).catch((e) => { setMsg(e.message); setLoaded(true); });
  };
  const loadCustomers = () => api('/api/customers').then(setCustomers).catch(() => {});
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [fl]);
  useEffect(() => {
    loadCustomers();
    const ch = sb.channel('tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load).subscribe();
    return () => sb.removeChannel(ch);
  }, []);

  const name = (id) => employees.find((e) => e.id === id)?.full_name || '-';
  const setF = (k) => (e) => setFl({ ...fl, [k]: e.target.value });
  const doAssign = (id, employee_id) => api(`/api/tasks/${id}/assign`, 'PATCH', { employee_id }).then(load);
  const assign = (x, employee_id) => {
    if (!employee_id) return;
    if (x.status === 'accepted') {
      setAsk({ title: 'Give this task to someone else?', text: `${name(x.assigned_to)} already accepted it. They will be told it was taken back.`, confirmText: 'Reassign',
        onConfirm: () => doAssign(x.id, employee_id) });
    } else doAssign(x.id, employee_id).catch((e) => setMsg(e.message));
  };
  const cancel = (x) => setAsk({ title: `Cancel "${x.title}"?`, text: `For ${x.customer_name}. The technician (if any) is told the reason.`, confirmText: 'Cancel task', danger: true,
    input: { label: 'Reason (min 3 characters)', min: 3, placeholder: 'e.g. Customer not available' },
    onConfirm: (reason) => api(`/api/tasks/${x.id}/cancel`, 'POST', { reason }).then(load) });
  const filtered = Object.entries(fl).some(([k, v]) => v && k !== 'date_by');
  const canEdit = (s) => !['completed', 'cancelled'].includes(s);
  const quick = (d) => setFl({ ...fl, date_by: 'scheduled', from: localDay(d), to: localDay(d) });

  return (
    <>
      <div className="head"><h2>{t('Tasks')}</h2><button className="primary" onClick={() => setShow(!show)}>{show ? 'Close form' : '+ New task'}</button></div>
      {show && <TaskForm employees={employees} customers={customers} onSaved={() => { setShow(false); load(); loadCustomers(); }} onCancel={() => setShow(false)} />}
      {msg && <div className="err">{msg}</div>}

      <div className="card filters">
        <input type="search" placeholder="Search customer, phone, address, service..." value={fl.q} onChange={setF('q')} />
        <select value={fl.status} onChange={setF('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
        <select value={fl.employee} onChange={setF('employee')}><option value="">All employees</option><option value="none">Unassigned</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
        <select value={fl.date_by} onChange={setF('date_by')}><option value="created">Created on</option><option value="scheduled">Scheduled on</option><option value="completed">Completed on</option></select>
        <input type="date" value={fl.from} onChange={setF('from')} aria-label="From date" />
        <input type="date" value={fl.to} onChange={setF('to')} aria-label="To date" />
        <button onClick={() => quick(0)}>Today</button><button onClick={() => quick(1)}>Tomorrow</button>
        {filtered && <button className="linkbtn" onClick={() => setFl({ q: '', status: '', employee: '', date_by: 'created', from: '', to: '' })}>Clear</button>}
      </div>

      <table>
        <thead><tr><th>Task</th><th>Customer</th><th>Status</th><th>Assigned to</th><th></th></tr></thead>
        <tbody>
          {tasks.length === 0 && <tr><td colSpan="5" className="empty">{!loaded ? 'Loading...' : filtered ? 'No tasks match these filters.' : 'No tasks yet. Create one above, then assign it.'}</td></tr>}
          {tasks.map((x) => (
            <tr key={x.id} className={x.status === 'cancelled' ? 'dim' : ''}>
              <td><Tl onClick={() => setDetail(x.id)}>{x.title}</Tl><small>{x.address}</small>
                {x.scheduled_at && <small>📅 {fmt(x.scheduled_at)}</small>}</td>
              <td>{x.customer_name}<small>{x.customer_phone || '-'}</small>
                <div className="links">
                  {telHref(x.customer_phone) && <a href={telHref(x.customer_phone)}>Call</a>}
                  {waHref(x.customer_phone) && <a href={waHref(x.customer_phone)} target="_blank" rel="noreferrer">WhatsApp</a>}
                  <a href={mapHref(x)} target="_blank" rel="noreferrer">Map</a></div></td>
              <td><span className={`pill ${x.status}`}>{x.status.replace('_', ' ')}</span>
                {x.reject_reason && x.status === 'rejected' && <small>Reason: {x.reject_reason}</small>}
                {x.cancel_reason && <small>Reason: {x.cancel_reason}</small>}
                {x.amount != null && <small>{inr(x.amount)} · {x.payment_status}</small>}
                {x.status === 'completed' && !x.report_sent_at && x.customer_email && <small className="bad">Report not emailed yet</small>}
                {x.status === 'completed' && x.amount != null && x.payment_status !== 'paid' && <small className="bad">Payment pending</small>}</td>
              <td>
                {['created', 'rejected', 'assigned', 'accepted'].includes(x.status)
                  ? <select value={x.assigned_to || ''} onChange={(e) => assign(x, e.target.value)} aria-label="Assign technician">
                      <option value="">{x.assigned_to ? 'Change technician...' : 'Assign to...'}</option>
                      {employees.filter((e) => e.status === 'active').map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  : name(x.assigned_to)}
              </td>
              <td className="actions">
                <button onClick={() => setDetail(x.id)}>Details</button>
                {canEdit(x.status) && <button onClick={() => setEditing(x)}>Edit</button>}
                {canEdit(x.status) && <button className="danger" onClick={() => cancel(x)}>Cancel</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length >= 300 && <small className="empty">Showing the latest 300. Use search or filters to narrow down.</small>}

      {editing && <Modal onClose={() => setEditing(null)} wide persistent><TaskForm initial={editing} employees={employees} customers={customers}
        onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} /></Modal>}
      {detail && <TaskDetails id={detail} onClose={() => setDetail(null)} reload={load} />}
      {ask && <Ask {...ask} onClose={() => setAsk(null)} />}
    </>
  );
}
