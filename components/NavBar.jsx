import { DARK, GREEN, GREENLT, GREENBDR } from './ui'

const TABS = [
  { id: 'focus',    l: 'Focus',    i: 'circle-dot'     },
  { id: 'goals',    l: 'Goals',    i: 'target'         },
  { id: 'coach',    l: 'Coach',    i: 'message-circle' },
  { id: 'journal',  l: 'Journal',  i: 'notebook'       },
  { id: 'progress', l: 'Progress', i: 'chart-bar'      },
]

export default function NavBar({ screen, setScreen }) {
  const isCoach = screen === 'coach'
  return (
    <div style={{
      display: 'flex',
      borderTop: `1px solid ${isCoach ? GREENBDR : '#e8e5e0'}`,
      background: isCoach ? GREENLT : '#fff',
    }}>
      {TABS.map(t => {
        const active = screen === t.id
        const color  = t.id === 'coach' ? GREEN : DARK
        return (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{
            flex: 1, padding: '11px 4px 9px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: active ? color : '#aaa',
            borderTop: active ? `2.5px solid ${color}` : '2.5px solid transparent',
          }}>
            <i className={`ti ti-${t.i}`} style={{ fontSize: 18 }} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{t.l}</span>
          </button>
        )
      })}
    </div>
  )
}
