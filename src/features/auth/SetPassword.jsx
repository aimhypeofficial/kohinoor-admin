import { useState } from 'react';
import { api } from '@/lib/api.js';

export default function SetPassword({ onDone, title = 'Set a new password', intro }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (p1.length < 8) return setMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
    if (p1 !== p2) return setMsg({ type: 'err', text: 'Passwords do not match.' });
    setBusy(true);
    try { await api('/api/me/password', 'POST', { password: p1 }); }
    catch (e2) { setBusy(false); return setMsg({ type: 'err', text: e2.message }); }
    setBusy(false);
    setP1(''); setP2('');
    setMsg({ type: 'ok', text: 'Password updated.' });
    onDone && setTimeout(onDone, 1200);
  };
  return (
    <form className="login" onSubmit={submit}>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      <input placeholder="New password (8+)" type="password" autoComplete="new-password" minLength={8} required value={p1} onChange={(e) => setP1(e.target.value)} />
      <input placeholder="Repeat new password" type="password" autoComplete="new-password" minLength={8} required value={p2} onChange={(e) => setP2(e.target.value)} />
      {msg.text && <div className={msg.type}>{msg.text}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Saving...' : 'Save password'}</button>
    </form>
  );
}
