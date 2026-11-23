import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase.js';
import { api } from '@/lib/api.js';
import Login from '@/features/auth/Login.jsx';
import SetPassword from '@/features/auth/SetPassword.jsx';
import Shell from './Shell.jsx';

const STAFF = ['admin', 'dispatcher'];

function Notice({ title, text, children }) {
  return (
    <div className="login">
      <h1>{title}</h1><p>{text}</p>
      {children}
      <button onClick={() => sb.auth.signOut()}>Sign out</button>
    </div>
  );
}

// Auth gate: session -> profile (/api/me) -> forced password change -> Shell.
export default function App() {
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadErr, setLoadErr] = useState(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY') setRecovery(true); setSession(s); });
    return () => data.subscription.unsubscribe();
  }, []);
  const loadMe = () => api('/api/me').then((m) => { setMe(m); setLoadErr(null); }).catch((e) => setLoadErr(e));
  const reloadEmployees = (silent) => api('/api/employees').then((d) => { setEmployees(d); setLoadErr(null); })
    .catch((e) => { if (silent !== true) setLoadErr(e); });
  useEffect(() => { if (session) loadMe(); else { setMe(null); setLoadErr(null); setEmployees([]); } }, [session]);
  useEffect(() => {
    if (!(me && STAFF.includes(me.role) && !me.must_change_password)) return undefined;
    reloadEmployees();
    const iv = setInterval(() => reloadEmployees(true), 30000);     // keeps "last seen" / "online" fresh
    return () => clearInterval(iv);
  }, [me]);

  if (session === undefined) return <div className="boot">Loading...</div>;
  if (!session) return <Login />;
  if (recovery) return <SetPassword title="Choose your new password" onDone={() => setRecovery(false)} />;
  if (loadErr) {
    const notAdmin = loadErr.status === 403;
    return (
      <Notice title={notAdmin ? 'No access' : 'Cannot load data'}
        text={notAdmin ? (/disabled/i.test(loadErr.message) ? 'This account is disabled. Please contact your admin.' : 'This account is not an admin or dispatcher.') : loadErr.message}>
        {!notAdmin && <button className="primary" onClick={loadMe}>Retry</button>}
      </Notice>
    );
  }
  if (!me) return <div className="boot">Loading...</div>;
  if (!STAFF.includes(me.role)) {
    return <Notice title="No access" text="This website is for admins and dispatchers. Technicians and customers should use the mobile app. If you just reset your password, it is saved: open the app and sign in." />;
  }
  if (me.must_change_password) {
    return <SetPassword title="Set your own password" intro="Your admin gave you a temporary password. Choose a new one to continue." onDone={loadMe} />;
  }
  return <Shell me={me} employees={employees} reloadEmployees={reloadEmployees} />;
}
