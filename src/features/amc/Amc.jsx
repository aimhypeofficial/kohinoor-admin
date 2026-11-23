import { useEffect, useState } from 'react';
import { api } from '@/lib/api.js';
import { fmt, fmtDay } from '@/lib/format.js';
import { telHref, waHref } from '@/lib/links.js';
import { Tl } from '@/components';
import { BRAND } from '@/config/brand.js';
import BookModal from '@/features/customers/BookModal.jsx';
import { reminderText, reminderOk } from './reminder.js';

export default function Amc({ employees, goCustomer }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState([]);
  const [book, setBook] = useState(null);
  const [sending, setSending] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const say = (type, text) => setMsg({ type, text });
  const load = () => api(`/api/amc?days=${days}`).then(setRows).catch((e) => say('err', e.message));
  useEffect(() => { load(); }, [days]);
  const remind = async (a) => {
    setSending(a.id);
    try { const r = await api(`/api/acs/${a.id}/remind`, 'POST'); say(reminderOk(r) ? 'ok' : 'err', reminderText(r)); load(); }
    catch (e) { say('err', e.message); } finally { setSending(null); }
  };
  const text = (a) => `Hi ${a.customer.name}, your ${[a.brand, a.model].filter(Boolean).join(' ') || 'AC'} is due for service on ${fmtDay(a.next_service_due)}. To book a visit reply here or call ${BRAND.phone}. - ${BRAND.short}`;
  const overdue = rows.filter((a) => a.overdue).length;
  return (
    <>
      <div className="head"><h2>Service reminders (AMC)</h2>
        <select value={days} onChange={(e) => setDays(+e.target.value)}>{[7, 30, 60, 90].map((n) => <option key={n} value={n}>Due in next {n} days</option>)}</select></div>
      <p className="meta">{rows.length} AC{rows.length === 1 ? '' : 's'} due{overdue ? `, ${overdue} overdue` : ''}. Customers also get an automatic reminder 7 days before the date when email/WhatsApp is set up.</p>
      {msg.text && <div className={msg.type}>{msg.text}</div>}
      <table>
        <thead><tr><th>Customer</th><th>AC</th><th>Last service</th><th>Due</th><th></th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="5" className="empty">Nothing due. Turn on “Remind for service” on a customer’s AC to see it here.</td></tr>}
          {rows.map((a) => (
            <tr key={a.id}>
              <td><Tl onClick={() => goCustomer(a.customer.id)}>{a.customer.name}</Tl><small>{a.customer.phone || a.customer.email}</small>
                <div className="links">{telHref(a.customer.phone) && <a href={telHref(a.customer.phone)}>Call</a>}
                  {waHref(a.customer.phone, text(a)) && <a href={waHref(a.customer.phone, text(a))} target="_blank" rel="noreferrer">WhatsApp</a>}</div></td>
              <td>{[a.type, a.brand, a.model].filter(Boolean).join(' ') || 'AC'}{a.location_label && <small>{a.location_label}</small>}</td>
              <td>{fmtDay(a.last_service_at)}</td>
              <td><span className={`pill ${a.overdue ? 'rejected' : 'assigned'}`}>{a.overdue ? 'Overdue ' : ''}{fmtDay(a.next_service_due)}</span>
                {a.last_reminded_at && <small>Reminded {fmt(a.last_reminded_at)}</small>}</td>
              <td className="actions">
                {a.has_open_task ? <span className="pill accepted">Booked</span> : <button className="primary" onClick={() => setBook(a)}>Book service</button>}
                <button disabled={sending === a.id} onClick={() => remind(a)}>{sending === a.id ? 'Sending...' : 'Send reminder'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {book && <BookModal ac={book} employees={employees} onClose={() => setBook(null)} onDone={() => { setBook(null); say('ok', 'Task created. Find it in Tasks to assign.'); load(); }} />}
    </>
  );
}
