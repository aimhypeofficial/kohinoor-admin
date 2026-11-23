// keyboard + screen-reader friendly "link" that runs an action
export function Tl({ onClick, children }) {
  return <a className="tl" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}>{children}</a>;
}
