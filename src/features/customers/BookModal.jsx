import { useState } from 'react';
import { api } from '@/lib/api.js';
import { fromLocalInput } from '@/lib/format.js';
import { Modal } from '@/components';
import { acName } from './acName.js';

// ---------- book a service for an AC (repeat job) ----------
export default function BookModal({ ac, employees, onClose, onDone }) {
  const [when, setWhen] = useState('');
  const [emp, setEmp] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setMsg('');
    try {
      await api(`/api/acs/${ac.id}/book`, 'POST', { ...(when ? { scheduled_at: fromLocalInput(when) } : {}), ...(emp ? { assigned_to: emp } : {}) });
      onDone();
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal onClose={onClose}>
      <h3>Book service</h3>
      <p>{acName(ac)}{ac.location_label ? ` (${ac.location_label})` : ''}</p>
      <label>Visit date &amp; time (optional)<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      <label>Assign to (optional)
        <select value={emp} onChange={(e) => setEmp(e.target.value)}><option value="">Assign later</option>
          {employees.filter((e) => e.status === 'active').map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>
      {msg && <div className="err">{msg}</div>}
      <div className="row"><button className="primary" disabled={busy} onClick={go}>{busy ? 'Creating...' : 'Create task'}</button><button onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}
