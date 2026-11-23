import { useState } from 'react';
import { api } from '@/lib/api.js';
import { ago } from '@/lib/format.js';
import { genPassword } from '@/lib/password.js';
import { useT } from '@/i18n';
import { Ask } from '@/components';

export default function Employees({ list, reload }) {
  const [t] = useT();
  const blank = { full_name: '', email: '', password: '', phone: '' };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const [ask, setAsk] = useState(null);
  const run = async (fn, done) => { try { await fn(); setMsg(''); setOk(done || ''); reload(); } catch (e) { setMsg(e.message); setOk(''); } };
  const ban = (e) => setAsk({ title: `Ban ${e.full_name}?`, text: 'They are signed out of the app and their open tasks go back to "unassigned".', confirmText: 'Ban', danger: true,
    onConfirm: () => api(`/api/employees/${e.id}/ban`, 'PATCH').then(() => reload()) });
  const del = (e) => setAsk({ title: `Delete ${e.full_name}?`, text: 'Their task history is kept. This cannot be undone from the website.', confirmText: 'Delete', danger: true,
    input: { label: 'Type DELETE to confirm', must: 'DELETE' }, onConfirm: () => api(`/api/employees/${e.id}`, 'DELETE').then(() => reload()) });
  const reset = (e) => setAsk({ title: `New password for ${e.full_name}`, text: 'Give this temporary password to the employee. They must choose their own at the next login.', confirmText: 'Set password',
    input: { label: 'Temporary password (8+ characters)', min: 8, generate: true },
    onConfirm: (pw) => api(`/api/users/${e.id}/reset-password`, 'POST', { password: pw }).then(() => setOk(`Password for ${e.full_name} is now: ${pw}`)) });
  return (
    <>
      <h2>{t('Employees')}</h2>
      <form className="row card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/api/employees', 'POST', f); setF(blank); }, 'Employee added.'); }}>
        <input placeholder="Full name" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input placeholder="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input placeholder="Temporary password (8+)" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button type="button" onClick={() => setF({ ...f, password: genPassword() })}>Generate</button>
        <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <button className="primary">Add employee</button>
      </form>
      {msg && <div className="err">{msg}</div>}
      {ok && <div className="ok">{ok}</div>}
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Last seen</th><th></th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan="5" className="empty">No employees yet. Add your first technician above.</td></tr>}
          {list.map((e) => {
            const ll = Array.isArray(e.last_locations) ? e.last_locations[0] : e.last_locations;
            return (
              <tr key={e.id}>
                <td>{e.full_name}</td><td>{e.phone || '-'}</td>
                <td><span className={`pill ${e.status}`}>{e.status}</span></td>
                <td>{ago(ll?.recorded_at)}</td>
                <td className="actions">
                  <button onClick={() => reset(e)}>Reset password</button>
                  {e.status === 'banned'
                    ? <button onClick={() => run(() => api(`/api/employees/${e.id}/unban`, 'PATCH'))}>Unban</button>
                    : <button onClick={() => ban(e)}>Ban</button>}
                  <button className="danger" onClick={() => del(e)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ask && <Ask {...ask} onClose={() => setAsk(null)} />}
    </>
  );
}
