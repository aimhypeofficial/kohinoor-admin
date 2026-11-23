import { useEffect, useState } from 'react';
import { api, download } from '@/lib/api.js';
import { fmt, inr } from '@/lib/format.js';
import { telHref, waHref, mapHref } from '@/lib/links.js';
import { PAY_METHODS } from '@/lib/constants.js';
import { Modal } from '@/components';

// ---------- details: timeline, photos, notes, bill, PDF ----------
const EVENT_LABEL = { created: 'Task created', assigned: 'Assigned', accepted: 'Accepted by technician', rejected: 'Rejected', in_progress: 'Work started',
  completed: 'Completed (OTP verified)', cancelled: 'Cancelled', edited: 'Edited', photo: 'Photo added', whatsapp_sent: 'WhatsApp sent',
  whatsapp_failed: 'WhatsApp failed', unassigned: 'Taken back from technician', report_emailed: 'Report emailed to customer', report_failed: 'Report email failed', payment: 'Payment received' };

export default function TaskDetails({ id, onClose, reload }) {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [items, setItems] = useState([]);
  const [gst, setGst] = useState(0);
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const say = (type, text) => setMsg({ type, text });
  const load = () => api(`/api/tasks/${id}`).then((x) => {
    setD(x); setItems((x.task.bill_items || []).map((i) => ({ ...i }))); setGst(Number(x.task.gst_percent) || 0); setPaid(x.task.payment_status === 'paid'); setMethod(x.task.payment_method || 'cash');
  }).catch((e) => say('err', e.message));
  useEffect(() => { load(); }, [id]);
  if (!d) return <Modal onClose={onClose}>{msg.text ? <div className="err">{msg.text}</div> : 'Loading...'}</Modal>;
  const t = d.task;
  const sub = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const total = sub + (sub * (Number(gst) || 0)) / 100;
  const run = async (fn, ok) => { setBusy(true); try { await fn(); say('ok', ok); load(); reload(); } catch (e) { say('err', e.message); } finally { setBusy(false); } };
  const setItem = (i, k, v) => setItems(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const billBody = () => {
    if (items.some((i) => !String(i.desc || '').trim() && (Number(i.rate) > 0 || Number(i.qty) > 1))) throw new Error('Every bill row needs a description. Fill it in, or remove the row with ×.');
    return {
      bill_items: items.filter((i) => String(i.desc || '').trim() && Number(i.qty) > 0).map((i) => ({ desc: String(i.desc).trim(), qty: Number(i.qty), rate: Number(i.rate) || 0 })),
      gst_percent: Number(gst) || 0, payment_status: paid ? 'paid' : 'unpaid', ...(paid ? { payment_method: method } : {}),
    };
  };
  const saveBill = () => run(() => api(`/api/tasks/${t.id}`, 'PATCH', billBody()), 'Bill saved.');
  // saves the bill first, so the customer never gets an older bill than the one on screen
  const sendReport = () => run(async () => { if (!closed) await api(`/api/tasks/${t.id}`, 'PATCH', billBody()); await api(`/api/tasks/${t.id}/send-report`, 'POST'); }, `Bill saved and report emailed to ${t.customer_email}.`);
  const pdf = () => download(`/api/tasks/${t.id}/report.pdf`, `service-report-${t.id.slice(0, 8)}.pdf`).catch((e) => say('err', e.message));
  const closed = t.status === 'cancelled';

  return (
    <Modal onClose={onClose} wide persistent>
      <h3>{t.title} <span className={`pill ${t.status}`}>{t.status.replace('_', ' ')}</span></h3>
      {msg.text && <div className={msg.type}>{msg.text}</div>}
      <div className="grid2 info">
        <div><b>{t.customer_name}</b><small>{t.customer_email || 'No email on file'}</small>
          <div className="links">{telHref(t.customer_phone) && <a href={telHref(t.customer_phone)}>Call {t.customer_phone}</a>}
            {waHref(t.customer_phone) && <a href={waHref(t.customer_phone)} target="_blank" rel="noreferrer">WhatsApp</a>}</div></div>
        <div>{t.address}<div className="links"><a href={mapHref(t)} target="_blank" rel="noreferrer">Open in Maps</a></div></div>
        <div><small>Technician</small>{d.technician?.full_name || '-'}</div>
        <div><small>Scheduled</small>{fmt(t.scheduled_at)}</div>
        <div><small>Payment</small>{t.amount != null ? `${inr(t.amount)} · ` : ''}{t.payment_status === 'paid' ? `paid${t.payment_method ? ` (${t.payment_method})` : ''}${t.paid_at ? ` ${fmt(t.paid_at)}` : ''}` : 'not paid yet'}</div>
        {d.ac && <div><small>AC</small>{[d.ac.type, d.ac.brand, d.ac.model].filter(Boolean).join(' ')}{d.ac.location_label ? ` (${d.ac.location_label})` : ''}</div>}
        {t.cancel_reason && <div><small>Cancel reason</small>{t.cancel_reason}</div>}
        {t.reject_reason && <div><small>Last reject reason</small>{t.reject_reason}</div>}
      </div>
      {t.description && <p><small>Job details</small>{t.description}</p>}
      <p><small>Technician notes</small>{t.notes || <i>None yet</i>}</p>

      <h4>Photos</h4>
      {d.photos.length === 0 ? <div className="empty">No photos yet.</div> : (
        <div className="photos">{d.photos.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={p.kind} /><span>{p.kind}</span></a>
        ))}</div>
      )}

      {!closed && (<>
        <h4>Bill</h4>
        <table className="bill">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th></th></tr></thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={n}>
                <td><input value={i.desc} placeholder="e.g. Gas refill R32" onChange={(e) => setItem(n, 'desc', e.target.value)} /></td>
                <td><input type="number" min="0" step="any" value={i.qty} onChange={(e) => setItem(n, 'qty', e.target.value)} /></td>
                <td><input type="number" min="0" step="any" value={i.rate} onChange={(e) => setItem(n, 'rate', e.target.value)} /></td>
                <td><button type="button" onClick={() => setItems(items.filter((_, j) => j !== n))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row billbar">
          <button type="button" onClick={() => setItems([...items, { desc: '', qty: 1, rate: 0 }])}>+ Add item</button>
          <label className="inline">GST %<input type="number" min="0" max="100" value={gst} onChange={(e) => setGst(e.target.value)} /></label>
          <label className="inline"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid</label>
          {paid && <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method">{PAY_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
          <b className="grow">Total {inr(total)}</b>
          <button className="primary" disabled={busy} onClick={saveBill}>Save bill</button>
        </div>
      </>)}

      <div className="row">
        <button onClick={pdf}>Download PDF</button>
        {t.status === 'completed' && (t.customer_email
          ? <button className="primary" disabled={busy} onClick={sendReport}>Save &amp; email report{items.length ? ' + bill' : ''} to customer</button>
          : <small>No email on file. Download the PDF and send it on WhatsApp.</small>)}
        {t.report_sent_at && <small>Last emailed {fmt(t.report_sent_at)}</small>}
      </div>

      <h4>History</h4>
      <ul className="timeline">
        {(d.events || []).map((e) => (
          <li key={e.id}><b>{EVENT_LABEL[e.event] || e.event}</b>
            {(e.employee_name || e.actor_name) && <> · {e.employee_name || e.actor_name}</>}
            {e.meta?.reason && <> · “{e.meta.reason}”</>}{e.meta?.kind && <> · {e.meta.kind}</>}{e.meta?.method && <> · {e.meta.method}</>}
            <small>{fmt(e.created_at)}</small></li>
        ))}
        {(d.events || []).length === 0 && <li className="empty">No history recorded.</li>}
      </ul>
    </Modal>
  );
}
