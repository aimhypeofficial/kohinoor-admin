import { useState } from 'react';
import { genPassword } from '@/lib/password.js';
import { Modal } from './Modal.jsx';

// Replaces the ugly browser prompt() / confirm().
// input: { label, placeholder, min, must, generate }  (must = exact text to type, e.g. "DELETE")
export function Ask({ title, text, input, confirmText = 'Confirm', danger, onConfirm, onClose }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = !input || (input.must ? v === input.must : v.trim().length >= (input.min || 1));
  const go = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr('');
    try { await onConfirm(v.trim()); onClose(); } catch (x) { setErr(x.message || 'Something went wrong'); setBusy(false); }
  };
  return (
    <Modal onClose={onClose}>
      <form className="taskform" onSubmit={go}>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {input && (
          <label>{input.label}
            <span className="row">
              <input className="grow" autoFocus placeholder={input.placeholder} value={v} onChange={(e) => setV(e.target.value)} />
              {input.generate && <button type="button" onClick={() => setV(genPassword())}>Generate</button>}
            </span>
          </label>
        )}
        {err && <div className="err">{err}</div>}
        <div className="row">
          <button className={danger ? 'danger' : 'primary'} disabled={!valid || busy}>{busy ? 'Please wait...' : confirmText}</button>
          <button type="button" onClick={onClose}>Back</button>
        </div>
      </form>
    </Modal>
  );
}
