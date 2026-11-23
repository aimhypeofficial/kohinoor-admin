import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase.js';
import { api } from '@/lib/api.js';
import { liveState, inr } from '@/lib/format.js';
import { useT } from '@/i18n';

const ORDER = ['created', 'assigned', 'accepted', 'in_progress', 'completed', 'rejected'];

export default function Overview({ employees }) {
  const [t] = useT();
  const [sum, setSum] = useState(null);
  const [recent, setRecent] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    let timer;
    const load = () => {
      api('/api/summary').then((d) => { setSum(d); setErr(''); }).catch((e) => setErr(e.message));
      api('/api/tasks?limit=6').then(setRecent).catch(() => {});
    };
    const soon = () => { clearTimeout(timer); timer = setTimeout(load, 700); };   // many events at once -> one refresh
    load();
    const ch = sb.channel('overview').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, soon).subscribe();
    const iv = setInterval(load, 120000);
    return () => { clearTimeout(timer); clearInterval(iv); sb.removeChannel(ch); };
  }, []);
  const c = sum?.counts || {};
  const n = (s) => c[s] || 0;
  const active = employees.filter((e) => e.status === 'active');
  const online = active.filter((e) => {
    const l = Array.isArray(e.last_locations) ? e.last_locations[0] : e.last_locations;
    return liveState(l?.recorded_at) === 'active';
  }).length;
  const kpis = [
    [t('Employees online'), `${online}/${active.length}`],
    [t('Needs assignment'), n('created') + n('rejected'), n('rejected') > 0],
    [t('Waiting for accept'), n('assigned')],
    [t('In progress'), n('accepted') + n('in_progress')],
    [t('Completed today'), sum?.completed_today ?? '-'],
    [t('Payments to collect'), sum ? inr(sum.pending_amount) : '-', (sum?.pending_amount || 0) > 0],
    [t('Collected this month'), sum ? inr(sum.collected_month) : '-'],
  ];
  const max = Math.max(1, ...ORDER.map(n));
  return (
    <>
      <h2>{t('Overview')}</h2>
      {err && <div className="err">{err}</div>}
      <div className="kpis">
        {kpis.map(([label, value, warn]) => (
          <div key={label} className={`card kpi${warn ? ' warn' : ''}`}><b>{value}</b><span>{label}</span></div>
        ))}
      </div>
      {n('rejected') > 0 && <div className="err">{n('rejected')} {t('Tasks need reassigning')}</div>}
      <div className="two">
        <div className="card">
          <h3>{t('Task status')}</h3>
          {ORDER.map((s) => (
            <div key={s} className="bar"><span>{s.replace('_', ' ')}</span><i style={{ width: `${(n(s) / max) * 100}%` }} className={s} /><em>{n(s)}</em></div>
          ))}
        </div>
        <div className="card">
          <h3>{t('Recent tasks')}</h3>
          {sum && recent.length === 0 && <div className="empty">{t('No tasks yet.')}</div>}
          {recent.map((x) => (
            <div key={x.id} className="recent"><div>{x.title}<small>{x.customer_name}</small></div><span className={`pill ${x.status}`}>{x.status.replace('_', ' ')}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}
