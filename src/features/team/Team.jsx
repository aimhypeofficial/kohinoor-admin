import { useEffect, useState } from 'react';
import { api } from '@/lib/api.js';
import { genPassword } from '@/lib/password.js';
import { Ask } from '@/components';

export default function Team({ meId }) {
  const [list, setList] = useState([]);
  const blank = { full_name: '', email: '', password: '', phone: '', role: 'dispatcher' };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const [ask, setAsk] = useState(null);
  const load = () => api('/api/staff').then(setList).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);
  const run = async (fn, done) => { try { await fn(); setMsg(''); setOk(done || ''); load(); } catch (e) { setMsg(e.message); setOk(''); } };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const changeRole = (p, role) => setAsk({
    title: `Make ${p.full_name} ${role === 'admin' ? 'an admin' : 'a dispatcher'}?`,
    text: role === 'admin' ? 'Admins can do everything: reports, audit log, map, staff and employees.' : 'They lose access to the map, reports, audit log and staff / employee management.',
    confirmText: 'Change role', onConfirm: () => api(`/api/staff/${p.id}/role`, 'PATCH', { role }).then(load) });
  const disable = (p) => setAsk({ title: `Disable ${p.full_name}?`, text: 'They can no longer sign in.', confirmText: 'Disable', danger: true,
    onConfirm: () => api(`/api/staff/${p.id}/ban`, 'PATCH').then(load) });
  const reset = (p) => setAsk({ title: `New password for ${p.full_name}`, text: 'Give this temporary password to them. They must choose their own at the next login.', confirmText: 'Set password',
    input: { label: 'Temporary password (8+ characters)', min: 8, generate: true },
    onConfirm: (pw) => api(`/api/users/${p.id}/reset-password`, 'POST', { password: pw }).then(() => setOk(`Password for ${p.full_name} is now: ${pw}`)) });
  return (
    <>
      <h2>Admins &amp; dispatchers</h2>
      <p className="meta"><b>Dispatcher</b> can create, edit, cancel and assign tasks, manage customers and see payments. They cannot see the map, reports, audit log, or manage employees. <b>Admin</b> can do everything.</p>
      <form className="row card" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/api/staff', 'POST', { ...f, phone: f.phone || undefined }); setF(blank); }, 'Added.'); }}>
        <input placeholder="Full name" required value={f.full_name} onChange={set('full_name')} />
        <input placeholder="Email" type="email" required value={f.email} onChange={set('email')} />
        <input placeholder="Temporary password (8+)" minLength={8} required value={f.password} onChange={set('password')} />
        <button type="button" onClick={() => setF({ ...f, password: genPassword() })}>Generate</button>
        <input placeholder="Phone" value={f.phone} onChange={set('phone')} />
        <select value={f.role} onChange={set('role')}><option value="dispatcher">Dispatcher</option><option value="admin">Admin</option></select>
        <button className="primary">Add</button>
      </form>
      {msg && <div className="err">{msg}</div>}
      {ok && <div className="ok">{ok}</div>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}><td>{p.full_name}{p.id === meId && <small>You</small>}</td><td>{p.email}</td>
              <td>{p.id === meId ? p.role : <select value={p.role} onChange={(e) => changeRole(p, e.target.value)}>
                <option value="dispatcher">dispatcher</option><option value="admin">admin</option></select>}</td>
              <td><span className={`pill ${p.status}`}>{p.status}</span></td>
              <td className="actions">{p.id !== meId && <>
                <button onClick={() => reset(p)}>Reset password</button>
                {p.status === 'banned'
                  ? <button onClick={() => run(() => api(`/api/staff/${p.id}/unban`, 'PATCH'))}>Enable</button>
                  : <button className="danger" onClick={() => disable(p)}>Disable</button>}</>}</td></tr>
          ))}
        </tbody>
      </table>
      {ask && <Ask {...ask} onClose={() => setAsk(null)} />}
    </>
  );
}
