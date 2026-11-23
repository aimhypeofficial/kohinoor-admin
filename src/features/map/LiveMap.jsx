import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { sb } from '@/lib/supabase.js';
import { ago, liveState } from '@/lib/format.js';
import { useT } from '@/i18n';

const COLOR = { active: '#1f9d55', idle: '#e0a100', offline: '#9aa5a1' };

// fly to an employee only when the selection changes (not on every refresh)
function FlyTo({ id, lat, lng }) {
  const map = useMap();
  useEffect(() => { if (id && lat != null && lng != null) map.flyTo([lat, lng], 16); }, [id]);
  return null;
}
// show everybody once, when the first locations arrive
function FitAll({ points }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 14); else map.fitBounds(points, { padding: [40, 40] });
  }, [points.length]);
  return null;
}

export default function LiveMap({ employees }) {
  const [t] = useT();
  const [locs, setLocs] = useState({});
  const [sel, setSel] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const m = {};
    employees.forEach((e) => { const l = Array.isArray(e.last_locations) ? e.last_locations[0] : e.last_locations; if (l) m[e.id] = l; });
    setLocs(m);
  }, [employees]);
  useEffect(() => {
    const ch = sb.channel('loc').on('postgres_changes', { event: '*', schema: 'public', table: 'last_locations' },
      (p) => p.new?.employee_id && setLocs((s) => ({ ...s, [p.new.employee_id]: p.new }))).subscribe();
    const iv = setInterval(() => tick((n) => n + 1), 10000);
    return () => { sb.removeChannel(ch); clearInterval(iv); };
  }, []);
  const active = employees.filter((e) => e.status === 'active');
  const here = sel ? locs[sel] : null;
  const points = active.filter((e) => locs[e.id]).map((e) => [locs[e.id].lat, locs[e.id].lng]);
  return (
    <>
      <h2>{t('Live map')}</h2>
      <div className="mapwrap">
        <ul className="emplist">
          {active.length === 0 && <li className="empty">No active employees.</li>}
          {active.map((e) => {
            const s = liveState(locs[e.id]?.recorded_at);
            return (
              <li key={e.id} className={sel === e.id ? 'on' : ''} role="button" tabIndex={0} onClick={() => setSel(e.id)} onKeyDown={(ev) => ev.key === 'Enter' && setSel(e.id)}>
                <i style={{ background: COLOR[s] }} />
                <div>{e.full_name}<small>{locs[e.id] ? `Updated ${ago(locs[e.id].recorded_at)}` : 'No location yet'}</small></div>
              </li>
            );
          })}
        </ul>
        <MapContainer center={[28.5355, 77.391]} zoom={11} className="map">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo id={sel} lat={here?.lat} lng={here?.lng} />
          <FitAll points={points} />
          {active.filter((e) => locs[e.id]).map((e) => {
            const l = locs[e.id];
            return (
              <CircleMarker key={e.id} center={[l.lat, l.lng]} radius={sel === e.id ? 11 : 8}
                pathOptions={{ color: '#fff', weight: 2, fillColor: COLOR[liveState(l.recorded_at)], fillOpacity: 1 }}>
                <Popup><b>{e.full_name}</b><br />{new Date(l.recorded_at).toLocaleString()}<br />{l.battery != null && `Battery ${l.battery}%`}</Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}
