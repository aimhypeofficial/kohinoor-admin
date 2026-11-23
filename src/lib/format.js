// Dates, money and "last seen" helpers.
const pad = (n) => String(n).padStart(2, '0');

export const ago = (iso) => {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
};

// technician GPS freshness: active < 2 min, idle < 10 min, else offline
export const liveState = (iso) => {
  if (!iso) return 'offline';
  const s = (Date.now() - new Date(iso)) / 1000;
  return s < 120 ? 'active' : s < 600 ? 'idle' : 'offline';
};

// <input type="datetime-local"> <-> ISO string
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const fmtDay = (ymd) => (ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

// yyyy-mm-dd in the browser's time zone, optionally n days from today
export const localDay = (offsetDays = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
