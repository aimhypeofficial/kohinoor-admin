// tel: / WhatsApp / Google Maps links. Return null when there is nothing to link.
export const telHref = (p) => (p ? `tel:${String(p).replace(/[^\d+]/g, '')}` : null);

export const waHref = (p, text) => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) d = `91${d}`;
  if (d.length < 11) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const mapHref = (t) => (t.lat != null && t.lng != null
  ? `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lng}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.address || '')}`);
