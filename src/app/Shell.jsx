import { Suspense, useEffect, useState } from 'react';
import { sb } from '@/lib/supabase.js';
import { useT, setLang } from '@/i18n';
import { BRAND } from '@/config/brand.js';
import { navFor } from './nav.jsx';

const TAB_KEY = 'tab';
const readTab = () => { try { return sessionStorage.getItem(TAB_KEY); } catch { return null; } };

// Signed-in layout: sidebar menu (role based) + the current screen.
export default function Shell({ me, employees, reloadEmployees }) {
  const [t, lang] = useT();
  const nav = navFor(me.role);
  const [tab, setTab] = useState(readTab);
  const [openCustomer, setOpenCustomer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const cur = nav.find((n) => n.key === tab) || nav[0];
  useEffect(() => { try { sessionStorage.setItem(TAB_KEY, cur.key); } catch { /* private mode */ } }, [cur.key]);

  const go = (key) => { setOpenCustomer(null); setTab(key); setMenuOpen(false); };
  const ctx = { me, employees, reloadEmployees, openCustomer, goCustomer: (id) => { setOpenCustomer(id); setTab('customers'); } };

  return (
    <div className="shell">
      <aside className={menuOpen ? 'open' : ''}>
        <div className="sidetop">
          <div className="brandchip"><img src="/logo.png" alt={BRAND.name} /></div>
          <button className="menubtn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰ {t(cur.label)}</button>
        </div>
        <nav className="sidenav">
          {nav.map((n) => <button key={n.key} className={cur.key === n.key ? 'on' : ''} onClick={() => go(n.key)}>{t(n.label)}</button>)}
          <div className="sidecontact"><b>{me.full_name}</b><span>{me.role === 'admin' ? 'Admin' : 'Dispatcher'}</span><a href={`tel:${BRAND.phoneRaw}`}>{BRAND.phone}</a><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a><a href={BRAND.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a><span>{BRAND.hours}</span></div>
          <button className="out" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}>{lang === 'hi' ? 'English' : 'हिन्दी'}</button>
          <button onClick={() => sb.auth.signOut()}>{t('Sign out')}</button>
        </nav>
      </aside>
      <main>
        <Suspense fallback={<div className="boot">Loading...</div>}>{cur.render(ctx)}</Suspense>
      </main>
    </div>
  );
}
