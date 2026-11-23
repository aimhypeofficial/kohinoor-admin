import { useEffect, useState } from 'react';
import { api, qs, download } from '@/lib/api.js';
import { localDay, inr } from '@/lib/format.js';

export default function Reports() {
  const [from, setFrom] = useState(localDay(-30));
  const [to, setTo] = useState(localDay());
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    api(`/api/reports/employees${qs({ from, to })}`).then((d) => { setRows(d.rows); setMsg(''); }).catch((e) => setMsg(e.message)).finally(() => setLoaded(true));
  }, [from, to]);
  const get = (path, name) => download(`${path}${qs({ from, to })}`, name).catch((e) => setMsg(e.message));
  const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
  const mins = (m) => (m == null ? '-' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);
  return (
    <>
      <h2>Reports</h2>
      <div className="row card">
        <label className="inline">From <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="inline">To <input type="date" value={to} min={from} max={localDay()} onChange={(e) => setTo(e.target.value)} /></label>
        <button onClick={() => { setFrom(localDay(-7)); setTo(localDay()); }}>7 days</button>
        <button onClick={() => { setFrom(localDay(-30)); setTo(localDay()); }}>30 days</button>
        <span className="grow" />
        <button onClick={() => get('/api/reports/employees.csv', `employee-report-${from}-to-${to}.csv`)}>Download employee report (CSV)</button>
        <button onClick={() => get('/api/reports/tasks.csv', `tasks-${from}-to-${to}.csv`)}>Download all tasks (CSV)</button>
      </div>
      {msg && <div className="err">{msg}</div>}
      <table>
        <thead><tr><th>Employee</th><th>Assigned</th><th>Accepted</th><th>Rejected</th><th>Completed</th><th>Avg time / job</th><th>Work hours</th><th>Billed</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="8" className="empty">{loaded ? 'No employees yet.' : 'Loading...'}</td></tr>}
          {rows.map((r) => (
            <tr key={r.employee_id}><td>{r.name}{r.status !== 'active' && <small>{r.status}</small>}</td><td>{r.assigned}</td><td>{r.accepted}</td>
              <td className={r.rejected ? 'bad' : ''}>{r.rejected}</td><td><b>{r.completed}</b></td><td>{mins(r.avg_minutes)}</td><td>{r.total_hours} h</td><td>{inr(r.revenue)}</td></tr>
          ))}
          {rows.length > 0 && <tr className="total"><td>Total</td><td>{sum('assigned')}</td><td>{sum('accepted')}</td><td>{sum('rejected')}</td><td>{sum('completed')}</td><td></td><td>{Math.round(sum('total_hours') * 10) / 10} h</td><td>{inr(sum('revenue'))}</td></tr>}
        </tbody>
      </table>
      <small className="empty">Assigned / accepted / rejected are counted from the date this version was installed. Completed jobs and time are counted from the task itself.</small>
    </>
  );
}
