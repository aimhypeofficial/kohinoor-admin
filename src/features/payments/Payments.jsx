import { useEffect, useState } from 'react';
import { api } from '@/lib/api.js';
import { fmt, inr } from '@/lib/format.js';
import { telHref, waHref } from '@/lib/links.js';
import { PAY_METHODS } from '@/lib/constants.js';
import { Modal } from '@/components';
import { BRAND } from '@/config/brand.js';

// Completed jobs whose payment has not been recorded yet
export default function Payments({ employees }) {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pay, setPay] = useState(null);
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api('/api/payments/pending').then((d) => { setRows(d); }).catch((e) => { setRows([]); setMsg({ type: 'err', text: e.message }); });
  useEffect(() => { load(); }, []);
  const name = (id) => employees.find((e) => e.id === id)?.full_name || '-';
  const total = (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const open = (r) => { setPay(r); setMethod('cash'); setAmount(''); setMsg({ type: '', text: '' }); };
  const save = async () => {
    setBusy(true);
    try {
      const body = { method };
      if (pay.amount == null) {
        if (!(Number(amount) > 0)) throw new Error('Enter the amount received.');
        body.amount = Number(amount);
      }
      await api(`/api/tasks/${pay.id}/payment`, 'POST', body);
      setPay(null); setMsg({ type: 'ok', text: 'Payment saved.' }); load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); } finally { setBusy(false); }
  };
  const text = (r) => `Hi ${r.customer_name}, the payment${r.amount != null ? ` of ${inr(r.amount)}` : ''} for your ${r.title} service is pending. Please pay by UPI/cash or call ${BRAND.phone}. - ${BRAND.short}`;
  return (
    <>
      <div className="head"><h2>Payments</h2></div>
      <p className="meta">{rows ? `${rows.length} completed job${rows.length === 1 ? '' : 's'} without a recorded payment` : 'Loading...'}{total ? ` · ${inr(total)} to collect` : ''}</p>
      {msg.text && !pay && <div className={msg.type}>{msg.text}</div>}
      <table>
        <thead><tr><th>Job</th><th>Completed</th><th>Technician</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {rows && rows.length === 0 && <tr><td colSpan="5" className="empty">All payments are recorded. 🎉</td></tr>}
          {(rows || []).map((r) => (
            <tr key={r.id}>
              <td>{r.title}<small>{r.customer_name} · {r.customer_phone || 'no phone'}</small></td>
              <td>{fmt(r.completed_at)}</td>
              <td>{name(r.assigned_to)}</td>
              <td>{r.amount != null ? inr(r.amount) : <small>No bill yet</small>}</td>
              <td className="actions">
                <button className="primary" onClick={() => open(r)}>Mark paid</button>
                {waHref(r.customer_phone, text(r)) && <a className="btnlink" href={waHref(r.customer_phone, text(r))} target="_blank" rel="noreferrer">WhatsApp reminder</a>}
                {telHref(r.customer_phone) && <a className="btnlink" href={telHref(r.customer_phone)}>Call</a>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pay && (
        <Modal onClose={() => setPay(null)}>
          <h3>Payment received</h3>
          <p>{pay.title} · {pay.customer_name}{pay.amount != null ? ` · ${inr(pay.amount)}` : ''}</p>
          <label>How was it paid?
            <select value={method} onChange={(e) => setMethod(e.target.value)}>{PAY_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          {pay.amount == null && <label>Amount received (Rs)<input type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>}
          {msg.text && <div className={msg.type}>{msg.text}</div>}
          <div className="row"><button className="primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button><button onClick={() => setPay(null)}>Cancel</button></div>
        </Modal>
      )}
    </>
  );
}
