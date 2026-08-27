import { useState } from 'react'
import { Btn, Card, Pill, DARK, BLUE, GREEN } from './ui'

export default function GoalsScreen({ goals, saveGoals, today, saveToday }) {
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [err,      setErr]      = useState('')

  async function addGoal() {
    if (!input.trim()) { setErr('Enter a goal first'); return }
    if (goals.length >= 5) { setErr('Max 5 goals — stay focused on what matters most'); return }
    setErr(''); setLoading(true)

    let steps = [
      'Define exactly what success looks like for this goal',
      'Research one method or resource to help you get started',
      'Take a first 5-minute action today',
    ]
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are an expert at breaking down abstract goals into concrete micro-steps using atomic habits principles. Each step should take 15–30 minutes. Use action verbs. Be specific and practical.',
          user: `Break this goal into 8–10 ordered micro-steps:\n"${input.trim()}"\n\nJSON only: {"steps":["step 1","step 2",...]}`,
        }),
      })
      const { text } = await res.json()
      steps = JSON.parse(text.replace(/```json?|```/g, '').trim()).steps || steps
    } catch {}

    const newGoal = { id: Date.now().toString(), title: input.trim(), steps, xp: 0, streak: 0, current_step: 0, last_completed: null }
    const updated = [...goals, newGoal]
    await saveGoals(updated)
    if (!today.focus_goal_id) await saveToday({ ...today, focus_goal_id: newGoal.id })
    setInput(''); setLoading(false)
  }

  async function deleteGoal(id) {
    const updated = goals.filter(g => g.id !== id)
    await saveGoals(updated)
    if (today.focus_goal_id === id)
      await saveToday({ ...today, focus_goal_id: updated[0]?.id || null, focus_step_override: null, ai_reframe: null, completed: false })
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '1.25rem', color: '#171717' }}>Goals</h2>

      {/* Add goal */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>
          <i className="ti ti-wand" style={{ fontSize: 13, marginRight: 4 }} />
          AI breaks your goal into micro-steps automatically
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} placeholder="E.g. Learn to play guitar…"
            onChange={e => { setInput(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            disabled={loading} />
          <Btn variant="primary" onClick={addGoal} disabled={loading} icon={loading ? 'loader' : 'plus'}>
            {loading ? 'Working…' : 'Add'}
          </Btn>
        </div>
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 8 }}>{err}</p>}
      </Card>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
          <i className="ti ti-target" style={{ fontSize: 40, display: 'block', marginBottom: 10 }} />
          <p style={{ fontSize: 15 }}>Add your first goal above</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goals.map(g => {
            const pct    = Math.round(((g.current_step || 0) / Math.max(g.steps?.length || 1, 1)) * 100)
            const isActive = today.focus_goal_id === g.id
            const isExp  = expanded === g.id
            return (
              <Card key={g.id} accent={isActive ? DARK : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, fontSize: 15, color: '#171717' }}>{g.title}</p>
                      {isActive && <Pill color={DARK}>Active</Pill>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888' }}>
                      <span><i className="ti ti-bolt" style={{ fontSize: 11 }} /> {g.xp || 0} XP</span>
                      <span><i className="ti ti-flame" style={{ fontSize: 11 }} /> {g.streak || 0} streak</span>
                      <span><i className="ti ti-steps" style={{ fontSize: 11 }} /> {g.steps?.length || 0} steps</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
                    {!isActive && (
                      <button onClick={() => saveToday({ ...today, focus_goal_id: g.id, focus_step_override: null, ai_reframe: null, completed: false })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: BLUE, padding: '4px 8px', fontWeight: 600 }}>
                        Set active
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExp ? null : g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                      <i className={`ti ti-chevron-${isExp ? 'up' : 'down'}`} style={{ fontSize: 15 }} />
                    </button>
                    <button onClick={() => deleteGoal(g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}>
                      <i className="ti ti-trash" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: isExp ? 14 : 0 }}>
                  <div style={{ height: 4, background: '#f0efec', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: DARK, borderRadius: 2, width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{pct}% complete</p>
                </div>

                {/* Steps */}
                {isExp && g.steps && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
                    {g.steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: i < (g.current_step || 0) ? 0.45 : 1 }}>
                        <div style={{
                          minWidth: 22, height: 22, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', marginTop: 1,
                          background: i < (g.current_step || 0) ? GREEN : '#f0efec',
                          flexShrink: 0,
                        }}>
                          {i < (g.current_step || 0)
                            ? <i className="ti ti-check" style={{ fontSize: 12, color: 'white' }} />
                            : <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{i + 1}</span>}
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.55, color: '#333', flex: 1 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
