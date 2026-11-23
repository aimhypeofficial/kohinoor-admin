import { useState } from 'react';
import { sb } from '@/lib/supabase.js';
import { BRAND } from '@/config/brand.js';

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const forgot = async () => {
    setErr(''); setInfo('');
    if (!f.email.trim()) return setErr('Type your email above first, then click Forgot password.');
    const { error } = await sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: window.location.origin });
    if (error) setErr(error.message); else setInfo('Reset link sent. Check your email (and spam).');
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setInfo('');
    const { error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    setBusy(false);
    if (error) setErr(/invalid login/i.test(error.message) ? 'Email or password is incorrect.'
      : /api key/i.test(error.message) ? 'Supabase key in admin/.env is wrong.' : error.message);
  };
  return (
    <form className="login" onSubmit={submit}>
      <img className="loginlogo" src="/logo.png" alt={BRAND.name} />
      <p>Sign in to dispatch your team.</p>
      <input placeholder="Admin email" type="email" autoComplete="username" required onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input placeholder="Password" type="password" autoComplete="current-password" required onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <div className="err">{err}</div>}
      {info && <div className="ok">{info}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      <button type="button" className="linkbtn" onClick={forgot}>Forgot password?</button>
      <small className="contact">{BRAND.phone} · {BRAND.email}<br />{BRAND.hours}<br />{BRAND.address}</small>
    </form>
  );
}
