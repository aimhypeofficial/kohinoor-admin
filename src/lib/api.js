import { sb } from './supabase.js';
import { env } from '@/config/env.js';

const API = env.apiUrl;
const noApi = () => Object.assign(new Error('VITE_API_URL is missing in admin/.env. Add it, then restart the admin dev server.'), { status: 0 });
const token = async () => (await sb.auth.getSession()).data.session?.access_token;

// JSON call to the backend with the login token. Throws Error(message) with .status on failure.
export async function api(path, method = 'GET', body) {
  const access = await token();
  if (!API) throw noApi();
  let r;
  try {
    r = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Is the backend running and VITE_API_URL correct?'), { status: 0 });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || `Request failed (${r.status})`), { status: r.status });
  return j;
}

// { a: 1, b: '' } -> "?a=1" (empty values are skipped)
export const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

// authenticated file download (PDF / CSV): the API needs the login token, so a plain <a href> would not work
export async function download(path, filename) {
  const access = await token();
  if (!API) throw noApi();
  let r;
  try { r = await fetch(API + path, { headers: { Authorization: `Bearer ${access}` } }); }
  catch { throw new Error('Cannot reach the server.'); }
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Download failed (${r.status})`); }
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
