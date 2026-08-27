"use client"; // Required by Next.js for interactive inputs, toggles, and state

import { useState } from 'react'
import { Btn, Card, Pill, DARK, BLUE, GREEN } from './ui' // Path updated to Next.js alias

// Local Database of Atomic Steps (No AI needed)
const LOCAL_STEP_TEMPLATES = {
  music: [
    'Research and choose a reliable basic learning method or app',
    'Set up your instrument in a visible area where you see it daily',
    'Practice basic finger exercises or warm-ups for 5 minutes',
    'Learn your first fundamental chord or music note shape',
    'Practice changing between two chord shapes smoothly',
    'Learn a basic rhythm strumming or plucking pattern',
    'Combine your chords and rhythm into a single song verse line',
    'Record yourself playing for 1 minute to check your timing',
  ],
  fitness: [
    'Pick a clear specific exercise schedule for the week ahead',
    'Prepare your workout clothing and gear the night before',
    'Complete a basic 5-minute dynamic physical warm-up stretching routine',
    'Perform a highly manageable 15-minute introductory workout session',
    'Log your completion metrics in a notebook or tracking journal',
    'Focus entirely on executing correct technique form over intensity',
    'Increase your workout duration gently by only 2 to 3 minutes',
    'Reflect on how your body feels and optimize your hydration level',
  ],
  coding: [
    'Set up your code editor workspace and create a blank workspace folder',
    'Follow a beginner hello-world tutorial for your chosen language',
    'Write out 3 basic variable declaration syntax strings manually',
    'Build a tiny conditional if-statement logic branch controller',
    'Encapsulate your logic blocks cleanly inside an isolated function container',
    'Intentionally break a line of code to practice reading error messages',
    'Build a simple text input tool that outputs to the console',
    'Write a short comment explaining how your logic system operates',
  ],
  writing: [
    'Create a dedicated document file and write down 3 messy ideas',
    'Draft a single sentence outlining the core message or story hook',
    'Set a kitchen timer and free-write anything for exactly 10 minutes',
    'Write out the first 100 words without stopping to edit or fix typos',
    'Outline the next 3 logical points or scenes you want to explore',
    'Flesh out the body text of your first main concept section',
    'Read your draft out loud to catch awkward phrasing and sentence breaks',
    'Fix spelling errors and celebrate completing a rough first draft',
  ]
};

export default function GoalsScreen({ goals, saveGoals, today, saveToday }) {
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [err,      setErr]      = useState('')

  // Local helper to match keyword text input strings to template arrays
  function generateLocalSteps(titleText) {
    const text = titleText.toLowerCase();
    
    if (text.includes('guitar') || text.includes('piano') || text.includes('sing') || text.includes('music') || text.includes('play')) {
      return LOCAL_STEP_TEMPLATES.music;
    }
    if (text.includes('run') || text.includes('gym') || text.includes('fit') || text.includes('walk') || text.includes('sport') || text.includes('health')) {
      return LOCAL_STEP_TEMPLATES.fitness;
    }
    if (text.includes('code') || text.includes('learn to program') || text.includes('python') || text.includes('react') || text.includes('build app')) {
      return LOCAL_STEP_TEMPLATES.coding;
    }
    if (text.includes('book') || text.includes('write') || text.includes('read') || text.includes('essay') || text.includes('journal')) {
      return LOCAL_STEP_TEMPLATES.writing;
    }

    // Default Fallback Template if no matching keyword is discovered
    return [
      `Define exactly what success looks like for: "${titleText}"`,
      'Research one reliable source or method to help you get started',
      'Clear a 15-minute block of time in your daily calendar system',
      'Prepare all necessary materials and tools the evening before',
      'Take a minor first 5-minute action step today to clear friction',
      'Review your execution path and adjust the difficulty layer',
      'Repeat the baseline action step 3 times to build consistency',
      'Track your milestone progress and reward yourself for turning up',
    ];
  }

  async function addGoal() {
    if (!input.trim()) { setErr('Enter a goal first'); return }
    if (goals.length >= 5) { setErr('Max 5 goals — stay focused on what matters most'); return }
    setErr(''); setLoading(true)

    setTimeout(async () => {
      const targetTitle = input.trim();
      const steps = generateLocalSteps(targetTitle);

      const newGoal = { 
        id: Date.now().toString(), 
        title: targetTitle, 
        steps, 
        xp: 0, 
        streak: 0, 
        current_step: 0, 
        last_completed: null 
      }

      const updated = [...goals, newGoal]
      await saveGoals(updated)
      
      if (!today.focus_goal_id) {
        await saveToday({ ...today, focus_goal_id: newGoal.id })
      }
      
      setInput(''); 
      setLoading(false)
    }, 400); 
  }

  async function deleteGoal(id) {
    const updated = goals.filter(g => g.id !== id)
    await saveGoals(updated)
    if (today.focus_goal_id === id) {
      await saveToday({ ...today, focus_goal_id: updated[0]?.id || null, focus_step_override: null, ai_reframe: null, completed: false })
    }
  }
  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '1.25rem', color: '#171717' }}>Goals</h2>

      {/* Add goal */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 10, fontWeight: 500 }}>
          <i className="ti ti-target" style={{ fontSize: 13, marginRight: 4 }} />
          Goals are instantly split into actionable atomic micro-steps.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} placeholder="E.g. Learn to play guitar…"
            onChange={e => { setInput(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            disabled={loading}
            style={{ flex: 1, padding: '0 12px', border: '1px solid #e0ddd8', borderRadius: 10, height: 44, fontSize: 14 }} />
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

                {/* Steps render list block */}
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
