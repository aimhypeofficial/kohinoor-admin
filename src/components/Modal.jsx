import { useEffect, useRef } from 'react';

// Shared modal. persistent = does not close on outside click / Esc (use for forms with unsaved work).
export function Modal({ children, onClose, wide, persistent }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (persistent) return undefined;
    const k = (e) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [persistent]);
  return (
    <div className="overlay" onMouseDown={(e) => !persistent && e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        <button className="x" aria-label="Close" onClick={onClose}>×</button>{children}
      </div>
    </div>
  );
}
