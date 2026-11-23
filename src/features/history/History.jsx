import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { api } from '@/lib/api.js';
import { useT } from '@/i18n';

function Fit({ pts }) {
  const map = useMap();
  useEffect(() => {
    if (pts.length > 1) map.fitBounds(pts.map((p) => [p.lat, p.lng]), { padding: [30, 30] });
    else if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 15);
  }, [pts]);
  return null;
}
const hav = (a, b) => {
  const r = (x) => (x * Math.PI) / 180, dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const localDay = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

export default function History({ employees }) {
  const [t] = useT();
  const [emp, setEmp] = useState('');
  const [day, setDay] = useState(localDay);
  const [pts, setPts] = useState([]);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!emp) return;
    setLoading(true); setPlay(false); setI(0);
    const start = new Date(day + 'T00:00:00'), end = new Date(start.getTime() + 86400000);
    api(`/api/employees/${emp}/route?since=${encodeURIComponent(start.toISOString())}&until=${encodeURIComponent(end.toISOString())}`)
      .then((d) => { setPts(d); setErr(d.length >= 5000 ? 'This day has more than 5000 points, so the end of the route is not shown.' : ''); })
      .catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [emp, day]);

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setI((x) => { if (x >= pts.length - 1) { setPlay(false); return x; } return x + 1; }), 400);
    return () => clearInterval(id);
  }, [play, pts]);

  const cur = pts[i];
  const km = pts.reduce((s, p, j) => (j ? s + hav(pts[j - 1], p) : s), 0);
  return (
    <>
      <h2>{t('Route history')}</h2>
      <div className="row card">
        <select value={emp} onChange={(e) => setEmp(e.target.value)}>
          <option value="">{t('Select employee')}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <input type="date" value={day} max={localDay()} onChange={(e) => setDay(e.target.value)} />
        {pts.length > 0 && <span className="meta">{pts.length} {t('points')} · {km.toFixed(1)} km</span>}
      </div>
      {err && <div className="err">{err}</div>}
      {emp && !loading && !err && pts.length === 0 && <div className="empty card">{t('No location data for this day.')}</div>}
      <MapContainer center={[28.5355, 77.391]} zoom={11} className="map hist">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Fit pts={pts} />
        {pts.length > 1 && <Polyline positions={pts.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#2d6fba', weight: 4, opacity: 0.7 }} />}
        {cur && <CircleMarker center={[cur.lat, cur.lng]} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: '#f2b01e', fillOpacity: 1 }} />}
      </MapContainer>
      {cur && (
        <div className="card scrub">
          <button className="primary" onClick={() => { if (i >= pts.length - 1) setI(0); setPlay(!play); }}>{play ? t('Pause') : t('Play')}</button>
          <input type="range" min="0" max={pts.length - 1} value={i} onChange={(e) => { setPlay(false); setI(+e.target.value); }} />
          <span>{new Date(cur.recorded_at).toLocaleTimeString()}{cur.speed != null && ` · ${(cur.speed * 3.6).toFixed(0)} km/h`}</span>
        </div>
      )}
    </>
  );
}
