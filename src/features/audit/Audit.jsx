import { useEffect, useState } from 'react';
import { api, qs } from '@/lib/api.js';
import { fmt } from '@/lib/format.js';

const GROUPS = [['', 'All activity'], ['task.', 'Tasks'], ['employee.', 'Employees'], ['staff.', 'Admins & dispatchers'], ['customer.', 'Customers'], ['ac.', 'ACs'], ['amc.', 'Reminders']];
const pretty = (a) => a.replace(/[._]/g, ' ');
const detail = (m) => {
  if (!m || typeof m !== 'object') return '';
  return Object.entries(m).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
};

export default function Audit() {
  const [action, setAction] = useState('');
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = (before) => {
    setBusy(true);
    api(`/api/audit${qs({ action, before, limit: 50 })}`)
      .then((d) => { setRows((r) => (before ? [...r, ...d.rows] : d.rows)); setNext(d.next_before); setMsg(''); })
      .catch((e) => setMsg(e.message)).finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, [action]);
  return (
    <>
      <div className="head"><h2>Audit log</h2>
        <select value={action} onChange={(e) => setAction(e.target.value)}>{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      {msg && <div className="err">{msg}</div>}
      <table>
        <thead><tr><th>When</th><th>Who</th><th>Action</th><th>On</th><th>Details</th></tr></thead>
        <tbody>
          {rows.length === 0 && !busy && <tr><td colSpan="5" className="empty">Nothing recorded yet.</td></tr>}
          {rows.map((r) => (
            <tr key={r.id}><td>{fmt(r.created_at)}</td><td>{r.actor_name}</td><td><span className="pill">{pretty(r.action)}</span></td>
              <td>{r.target_name || '-'}</td><td><small>{detail(r.meta)}</small></td></tr>
          ))}
        </tbody>
      </table>
      {next && <div className="row"><button disabled={busy} onClick={() => load(next)}>{busy ? 'Loading...' : 'Load older'}</button></div>}
    </>
  );
}
