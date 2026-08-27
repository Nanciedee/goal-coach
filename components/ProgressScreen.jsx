"use client"; // Declares this file as a Client Component for dynamic layout execution

import { Card, DARK, BLUE, CORAL, GREEN } from './ui' // Path updated to Next.js alias

export default function ProgressScreen({ goals, today }) {
  const totalXP    = goals.reduce((s, g) => s + (g.xp    || 0), 0)
  const maxStreak  = goals.reduce((m, g) => Math.max(m, g.streak || 0), 0)
  const stepsTotal = goals.reduce((s, g) => s + (g.current_step || 0), 0)

  const days    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const barMax  = Math.max(goals.length, 1)
  const weekData = days.map((d, i) => ({
    d, v: Math.min(goals.length, Math.max(0, goals.filter(g => (g.streak || 0) > (6 - i)).length)),
  }))

  const stats = [
    { l: 'Total XP',     v: totalXP,          c: DARK,  i: 'bolt'   },
    { l: 'Best streak',  v: `${maxStreak}d`,  c: CORAL, i: 'flame'  },
    { l: 'Active goals', v: goals.length,      c: GREEN, i: 'target' },
    { l: 'Steps done',   v: stepsTotal,        c: BLUE,  i: 'check'  },
  ]
  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '1.5rem', color: DARK }}>Progress</h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <Card key={s.l} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <i className={`ti ti-${s.i}`} style={{ fontSize: 15, color: s.c }} />
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.l}</p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</p>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 13, color: '#555', fontWeight: 600, marginBottom: '1rem' }}>This week</p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 84 }}>
          {weekData.map(({ d, v }) => (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                background: v > 0 ? DARK : '#e8e5e0',
                height: `${Math.round((v / barMax) * 68) + (v > 0 ? 10 : 4)}px`,
                transition: 'height 0.3s',
              }} />
              <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>{d}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Goal breakdown */}
      {goals.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#555', fontWeight: 600, marginBottom: 12 }}>Goal breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {goals.map(g => {
              const pct = Math.round(((g.current_step || 0) / Math.max(g.steps?.length || 1, 1)) * 100)
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{g.title}</p>
                    <p style={{ fontSize: 13, color: '#888' }}>{pct}%</p>
                  </div>
                  <div style={{ height: 5, background: '#f0efec', borderRadius: 3 }}>
                    <div style={{ height: '100%', background: DARK, borderRadius: 3, width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    <i className="ti ti-bolt" style={{ fontSize: 11 }} /> {g.xp || 0} XP &nbsp;·&nbsp;
                    <i className="ti ti-flame" style={{ fontSize: 11 }} /> {g.streak || 0} day streak
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
