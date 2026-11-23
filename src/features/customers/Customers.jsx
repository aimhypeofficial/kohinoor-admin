import { useEffect, useState } from 'react';
import { api, qs } from '@/lib/api.js';
import { Tl } from '@/components';
import CustomerPage from './CustomerPage.jsx';

// ---------- list ----------
export default function Customers({ employees, role, initialOpen }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(initialOpen || null);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '' });
  const [msg, setMsg] = useState('');
  const load = () => api(`/api/customers${qs({ q: q.trim() })}`).then((d) => { setList(d); setMsg(''); }).catch((e) => setMsg(e.message));
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [q]);
  if (open) return <CustomerPage id={open} employees={employees} role={role} onBack={() => { setOpen(null); load(); }} />;
  const create = async (e) => {
    e.preventDefault();
    try {
      const c = await api('/api/customers', 'POST', { name: f.name.trim(), phone: f.phone.trim() || null, email: f.email.trim() || null, address: f.address.trim() || null });
      setShow(false); setF({ name: '', phone: '', email: '', address: '' }); setOpen(c.id);
    } catch (x) { setMsg(x.message); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <div className="head"><h2>Customers</h2><button className="primary" onClick={() => setShow(!show)}>{show ? 'Close' : '+ Add customer'}</button></div>
      {show && (
        <form className="card grid2" onSubmit={create}>
          <label>Name<input required value={f.name} onChange={set('name')} /></label>
          <label>Phone<input type="tel" value={f.phone} onChange={set('phone')} /></label>
          <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
          <label>Address<input value={f.address} onChange={set('address')} /></label>
          <div className="row"><button className="primary">Save customer</button></div>
        </form>
      )}
      {msg && <div className="err">{msg}</div>}
      <div className="card filters"><input type="search" placeholder="Search name, phone, email, address..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <table>
        <thead><tr><th>Customer</th><th>Contact</th><th>Address</th><th>ACs</th><th></th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan="5" className="empty">{q ? 'No customer matches.' : 'No customers yet. They are added automatically when you create a task, or add one here.'}</td></tr>}
          {list.map((c) => (
            <tr key={c.id}><td><Tl onClick={() => setOpen(c.id)}>{c.name}</Tl></td>
              <td>{c.phone || '-'}<small>{c.email || ''}</small></td><td>{c.address || '-'}</td><td>{c.ac_count}</td>
              <td className="actions"><button onClick={() => setOpen(c.id)}>Open</button></td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
