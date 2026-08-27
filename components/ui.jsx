// ── Design tokens ────────────────────────────────────────────
export const DARK    = '#171717'   // Goal Coach primary (buttons, headers)
export const BLUE    = '#185FA5'   // Attain accent (focus card border, XP)
export const CORAL   = '#D85A30'   // Energy / streaks
export const GREEN   = '#1D9E75'   // Success / complete
export const GREENLT = '#EFF6F3'   // Aria coach background
export const GREENBDR= '#C0DD97'   // Aria coach border
export const GREENDARK='#27500A'   // Aria coach text
export const BEIGE   = '#f8f7f4'   // App background
export const CARD    = '#ffffff'   // Card background

// ── Components ───────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'ghost', disabled, full, icon, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '13px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: full ? '100%' : 'auto', opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s',
  }
  const variants = {
    primary: { background: DARK,  border: 'none', color: '#fff' },
    ghost:   { background: '#fff', border: '1px solid #e0ddd8', color: DARK },
    blue:    { background: BLUE,  border: 'none', color: '#fff' },
    green:   { background: GREEN, border: 'none', color: '#fff' },
    soft:    { background: '#f0efec', border: 'none', color: DARK },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <i className={`ti ti-${icon}`} style={{ fontSize: 16 }} />}
      {children}
    </button>
  )
}

export function Card({ children, accent, style = {} }) {
  return (
    <div style={{
      background: CARD, borderRadius: 16,
      border: accent ? `2px solid ${accent}` : '1px solid #e8e5e0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '1.1rem 1.25rem', ...style,
    }}>
      {children}
    </div>
  )
}

export function Pill({ children, color = DARK }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 11px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      background: color === DARK ? '#f0efec' : color + '1a',
      color,
    }}>
      {children}
    </span>
  )
}
