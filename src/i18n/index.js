import { useSyncExternalStore } from 'react';
const HI = {
  'Payments': 'पेमेंट', 'Payments to collect': 'वसूली बाकी', 'Collected this month': 'इस महीने की वसूली', 'Reports': 'रिपोर्ट',
  'Customers': 'ग्राहक', 'Service reminders': 'सर्विस रिमाइंडर', 'Change password': 'पासवर्ड बदलें', 'No tasks yet.': 'अभी कोई टास्क नहीं।',
  'Overview': 'ओवरव्यू', 'Live map': 'लाइव मैप', 'Route history': 'रूट हिस्ट्री', 'Employees': 'कर्मचारी',
  'Tasks': 'टास्क', 'Sign out': 'साइन आउट', 'Employees online': 'ऑनलाइन कर्मचारी',
  'Needs assignment': 'असाइन करना बाकी', 'Waiting for accept': 'स्वीकार का इंतज़ार', 'In progress': 'चालू काम',
  'Completed today': 'आज पूरे हुए', 'Task status': 'टास्क की स्थिति', 'Recent tasks': 'हाल के टास्क',
  'Tasks need reassigning': 'टास्क दोबारा असाइन करने हैं', 'Select employee': 'कर्मचारी चुनें', 'points': 'पॉइंट',
  'No location data for this day.': 'इस दिन का कोई लोकेशन डेटा नहीं है।', 'Play': 'चलाएँ', 'Pause': 'रोकें',
  'No tasks yet.': 'अभी कोई टास्क नहीं है।', 'Change password': 'पासवर्ड बदलें',
  'Customers': 'ग्राहक', 'Service reminders': 'सर्विस रिमाइंडर', 'Reports': 'रिपोर्ट', 'Audit log': 'ऑडिट लॉग',
  'Admins & dispatchers': 'एडमिन और डिस्पैचर',
};
let lang = 'en';
try { lang = localStorage.getItem('lang') || 'en'; } catch {}
const subs = new Set();
export const setLang = (l) => { lang = l; try { localStorage.setItem('lang', l); } catch {} subs.forEach((f) => f()); };
export function useT() {
  const l = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => lang);
  return [(k) => (l === 'hi' ? HI[k] || k : k), l];
}
