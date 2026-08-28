"use client";

import { useState } from 'react'
import { createClient } from '../lib/supabase'
import { Btn, Card, Pill, DARK, BLUE, CORAL, GREEN } from './ui'

const BLOCKS = {
  procrastination: 'task paralysis and avoidance',
  perfectionism:   'perfectionism and all-or-nothing thinking',
  overwhelm:       'cognitive overwhelm and decision fatigue',
  inconsistency:   'motivation fluctuation and habit gaps',
}

const LOCAL_REFRAMES = {
  1: "Energy is very low. Lowering the bar isn't quitting; it's a strategic retreat to protect your consistency.",
  2: "Energy is low. Be gentle with your timeline today. A small action counts just as much as a giant leap.",
  3: "Energy is moderate. Show up with an open mind. Momentum builds up naturally once you handle the friction.",
  4: "Energy is high. You have a great focus runway ahead. Lock out distractions and make some solid headway.",
  5: "Energy is fantastic! Take full advantage of this peak flow state to check off a demanding step."
};

export default function FocusScreen({ profile, goals, today, saveToday, saveGoals }) {
  const supabase = createClient();
  const [aiLoading, setAiLoading] = useState(false)
  const [flash, setFlash]         = useState(false)
  
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");

  const activeGoal = goals.find(g => g.id === today.focus_goal_id) || goals[0]
  const stepIdx    = today.focus_step_override ?? activeGoal?.current_step ?? 0
  const focusStep  = activeGoal?.steps?.[stepIdx]
  const totalXP    = goals.reduce((s, g) => s + (g.xp || 0), 0)
  const maxStreak  = goals.reduce((m, g) => Math.max(m, g.streak || 0), 0)

  async function handleAddGoal(e) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setCreatingGoal(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("Please sign in first.");
      setCreatingGoal(false);
      return;
    }

    // FIXED: Only insert columns we verified exist ('user_id', 'title', 'created_at')
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: newGoalTitle.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setCreatingGoal(false);
      return;
    }

    const newLocalGoal = {
      ...data,
      steps: [],
      current_step: 0,
      xp: 0,
      streak: 0
    };
    
    await saveGoals([...goals, newLocalGoal]);
    
    if (goals.length === 0) {
      await saveToday({ ...today, focus_goal_id: data.id });
    }

    setNewGoalTitle("");
    setCreatingGoal(false);
  }

  async function recalibrate() {
    if (!activeGoal?.steps?.length) return
    setAiLoading(true)
    
    setTimeout(async () => {
      const currentEnergy = today.energy_level || 3;
      let targetIndex = activeGoal.current_step || 0;
      if (currentEnergy <= 2) {
        targetIndex = Math.max(0, targetIndex - 1);
      } else if (currentEnergy >= 4) {
        targetIndex = Math.min(activeGoal.steps.length - 1, targetIndex + 1);
      }

      const generatedReframe = LOCAL_REFRAMES[currentEnergy] || LOCAL_REFRAMES[3];

      await saveToday({ 
        ...today, 
        focus_step_override: targetIndex, 
        ai_reframe: generatedReframe 
      });
      setAiLoading(false)
    }, 450);
  }

  async function markDone() {
    if (!activeGoal || today.completed) return
    setFlash(true)
    const bonus    = today.energy_level === 1 ? 5 : 0
    const nextStep = Math.min((activeGoal.current_step || 0) + 1, (activeGoal.steps?.length || 1) - 1)
    await saveGoals(goals.map(g =>
      g.id === activeGoal.id
        ? { ...g, xp: (g.xp || 0) + 10 + bonus, streak: (g.streak || 0) + 1, current_step: nextStep }
        : g
    ))
    await saveToday({ ...today, completed: true })
    setTimeout(() => setFlash(false), 2000)
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
        <Card style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>XP</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: DARK }}>{totalXP}</p>
        </Card>
        <Card style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Streak</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: CORAL }}>{maxStreak}d</p>
        </Card>
        <Card style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Energy</p>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} onClick={() => saveToday({ ...today, energy_level: n })}
                style={{ width: 9, height: 16, borderRadius: 3, cursor: 'pointer', background: n <= (today.energy_level || 3) ? CORAL : '#e8e5e0', transition: 'background 0.15s' }} />
            ))}
          </div>
        </Card>
      </div>

      {goals.length === 0 ? (
        <Card style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <i className="ti ti-target" style={{ fontSize: 40, color: '#ccc', display: 'block', marginBottom: 14 }} />
          <p style={{ color: '#666', fontSize: 15, marginBottom: '20px' }}>Add a goal to get your first focus step</p>
          
          <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Enter your goal title..." 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                color: '#333'
              }}
            />
            <button 
              type="submit" 
              disabled={creatingGoal || !newGoalTitle.trim()}
              style={{
                padding: '12px',
                background: DARK,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {creatingGoal ? "Adding..." : "Add Goal"}
            </button>
            {errorMsg && <p style={{ color: 'red', fontSize: '13px', marginTop: '5px' }}>{errorMsg}</p>}
          </form>
        </Card>

      ) : today.completed ? (
        <Card style={{ textAlign: 'center', padding: '2.5rem', border: `2px solid ${GREEN}` }}>
          <i className="ti ti-circle-check" style={{ fontSize: 48, color: GREEN, display: 'block', marginBottom: 14 }} />
          <h2 style={{ fontSize: 18, marginBottom: 8, color: GREEN, fontWeight: 600 }}>Today's task complete!</h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            +10 XP{today.energy_level === 1 ? ' + 5 bonus for showing up on a hard day' : ''} earned
          </p>
          <p style={{ color: '#aaa', fontSize: 13, marginTop: 10 }}>Come back tomorrow for your next step.</p>
        </Card>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>
            Your one thing today
          </p>
          <Card accent={DARK} style={{ marginBottom: 14 }}>
            {activeGoal && (
              <div style={{ marginBottom: 12 }}>
                <Pill color={DARK}>{activeGoal.title}</Pill>
              </div>
            )}
            <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 14, color: DARK }}>
              {focusStep || 'No steps yet — add a goal first'}
            </p>
            {today.ai_reframe && (
              <div style={{ borderTop: '1px solid #f0efec', paddingTop: 12 }}>
                <p style={{ fontSize: 13, color: BLUE, lineHeight: 1.6, margin: 0 }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 13, marginRight: 5 }} />
                  {today.ai_reframe}
                </p>
              </div>
            )}
          </Card>

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="primary" onClick={markDone} full icon="check" disabled={!focusStep || flash}>
              {flash ? 'Done! XP earned ✓' : 'Mark done'}
            </Btn>
            <Btn variant="ghost" onClick={recalibrate} icon="refresh" disabled={aiLoading || !activeGoal}>
              {aiLoading ? '…' : 'Recalibrate'}
            </Btn>
          </div>

          {activeGoal?.steps?.length > 1 && (
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>
              Step {stepIdx + 1} of {activeGoal.steps.length} · Tap Recalibrate if your energy changes
            </p>
          )}
        </>
      )}
    </div>
  )
}
