'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { C, type GoalStep, type ChatMessage, type MediaItem } from '../../lib/types'
import { generateGoalSteps, recalibrateStep } from '../../lib/goal-generator'
import { getOsirisResponse } from '../../lib/cbt-engine'

interface Profile {
  id: string
  display_name: string
  onboarded: boolean
  profile_data: Record<string, string>
}

interface DBGoal {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  steps: GoalStep[]
  current_step: number
  xp: number
  streak: number
}

const ONBOARD_QS = [
  { key: 'style', q: 'How do you work best?', opts: ['I plan everything ahead', 'I stay flexible and adapt', 'I need someone to hold me accountable', 'Quick wins keep me going'] },
  { key: 'block', q: "What's your biggest block to reaching goals?", opts: ['I start strong but lose momentum', "I get overwhelmed at the start", 'Life gets busy and I forget', "I'm too hard on myself when I slip"] },
  { key: 'peak', q: 'When is your energy highest?', opts: ['Early morning', 'Mid-morning', 'Afternoon', 'Evening'] },
  { key: 'motive', q: 'What motivates you most?', opts: ['Seeing visible progress', 'Helping others and my family', 'Personal growth and learning', 'Recognition and rewards'] },
]

type TabId = 'home' | 'goals' | 'coach' | 'journal'

const NAV: { id: TabId; emoji: string; label: string; isOsiris?: boolean }[] = [
  { id: 'home',    emoji: '🏠', label: 'Focus' },
  { id: 'goals',   emoji: '🎯', label: 'Goals' },
  { id: 'coach',   emoji: '✦', label: 'Osiris', isOsiris: true },
  { id: 'journal', emoji: '📖', label: 'Journal' },
]

export default function FocusPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading]     = useState(true)
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [goals, setGoals]         = useState<DBGoal[]>([])
  const [totalXp, setTotalXp]     = useState(0)
  const [tab, setTab]             = useState<TabId>('home')

  // Onboarding
  const [obStep, setObStep]       = useState(0)
  const [obAnswers, setObAnswers] = useState<Record<string, string>>({})
  const [obSaving, setObSaving]   = useState(false)

  // Home
  const [energy, setEnergy]       = useState(3)
  const [recalNote, setRecalNote] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMsg, setAiMsg]         = useState('')

  // Goals
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDesc, setNewGoalDesc]   = useState('')
  const [goalLoading, setGoalLoading]   = useState(false)

  // Coach
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Journal
  const [jMood, setJMood]   = useState('')
  const [jText, setJText]   = useState('')
  const [jMedia, setJMedia] = useState<MediaItem[]>([])
  const [jSaved, setJSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Toast
  const [toast, setToast] = useState('')

  const activeGoal = goals.find(g => g.status === 'active') ?? null
  const focusTask  = activeGoal ? (activeGoal.steps[activeGoal.current_step] ?? null) : null

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Load all data on mount ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const [
        { data: prof },
        { data: gs },
        { data: msgs },
        { data: xpRows },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('chat_messages').select('role, content').eq('user_id', user.id).order('created_at').limit(50),
        supabase.from('xp').select('amount').eq('user_id', user.id),
      ])

      setProfile(prof)
      setGoals((gs ?? []) as DBGoal[])
      setTotalXp((xpRows ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0))

      const history: ChatMessage[] = (msgs ?? []).map((m: any) => ({
        role: m.role as 'user' | 'osiris',
        content: m.content,
      }))

      if (history.length === 0 && prof?.display_name) {
        const first = prof.display_name.split(' ')[0]
        history.push({
          role: 'osiris',
          content: `Welcome, ${first}. I'm Osiris — your personal coach. ✦\n\nI'm here whenever you need to think through a goal, work through a block, or just check in. No judgement here — only forward movement.\n\nWhat would you like to work on first?`,
        })
      }
      setChatHistory(history)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chatHistory, chatLoading])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  async function finishOnboard() {
    setObSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ onboarded: true, profile_data: obAnswers }).eq('id', user.id)
    setProfile(prev => prev ? { ...prev, onboarded: true, profile_data: obAnswers } : prev)
    setObSaving(false)
  }

  // ── Goals ─────────────────────────────────────────────────────────────────
  async function addGoal() {
    if (!newGoalTitle.trim() || goalLoading) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setGoalLoading(true)
    setAiMsg('Building your step-by-step plan…')
    await new Promise(r => setTimeout(r, 1000))

    const steps = generateGoalSteps(newGoalTitle)

    if (activeGoal) {
      await supabase.from('goals').update({ status: 'pending' }).eq('id', activeGoal.id)
    }

    const { data: goal } = await supabase
      .from('goals')
      .insert({ user_id: user.id, title: newGoalTitle.trim(), description: newGoalDesc.trim() || null, status: 'active', steps, current_step: 0, xp: 0, streak: 0 })
      .select().single()

    if (goal) {
      setGoals(prev => [...prev.map(g => ({ ...g, status: 'pending' as const })), goal as DBGoal])
      setNewGoalTitle('')
      setNewGoalDesc('')
      showToast('Goal added — your plan is ready! 🎯')
      setTab('home')
    }
    setGoalLoading(false)
    setAiMsg('')
  }

  // ── Complete step ─────────────────────────────────────────────────────────
  async function completeStep() {
    if (!activeGoal || !focusTask) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const nextIdx = activeGoal.current_step + 1
    const isDone  = nextIdx >= activeGoal.steps.length
    const newXp   = (activeGoal.xp ?? 0) + 50
    const newStreak = (activeGoal.streak ?? 0) + 1

    await supabase.from('goals').update({
      current_step: isDone ? activeGoal.current_step : nextIdx,
      status: isDone ? 'completed' : 'active',
      xp: newXp, streak: newStreak,
    }).eq('id', activeGoal.id)

    await supabase.from('xp').insert({ user_id: user.id, amount: 50, reason: 'task_completed', task_id: activeGoal.id })

    setTotalXp(p => p + 50)
    setRecalNote('')
    setGoals(prev => prev.map(g => g.id === activeGoal.id
      ? { ...g, current_step: isDone ? g.current_step : nextIdx, status: isDone ? 'completed' : 'active', xp: newXp, streak: newStreak }
      : g))
    showToast(isDone ? 'Goal complete! 🎉 +50 XP' : '+50 XP — keep going! ⚡')
  }

  // ── Recalibrate ───────────────────────────────────────────────────────────
  async function doRecalibrate() {
    if (!activeGoal || aiLoading) return
    setAiLoading(true)
    setAiMsg('Finding the right step for your energy…')
    await new Promise(r => setTimeout(r, 800))

    const result = recalibrateStep(activeGoal.steps, activeGoal.current_step, energy)
    if (result) {
      const newIdx = result.step.step - 1
      await supabase.from('goals').update({ current_step: newIdx }).eq('id', activeGoal.id)
      setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, current_step: newIdx } : g))
      setRecalNote(result.reason)
    }
    setAiLoading(false)
    setAiMsg('')
  }

  // ── Set active goal ───────────────────────────────────────────────────────
  async function makeActive(goalId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('goals').update({ status: 'pending' }).eq('user_id', user.id)
    await supabase.from('goals').update({ status: 'active' }).eq('id', goalId)
    setGoals(prev => prev.map(g => ({ ...g, status: g.id === goalId ? 'active' as const : 'pending' as const })))
    setRecalNote('')
    setTab('home')
    showToast('Active goal updated ✓')
  }

  // ── Osiris chat ───────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const txt = chatInput.trim()
    setChatInput('')
    setChatLoading(true)
    setChatHistory(h => [...h, { role: 'user', content: txt }])
    await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: txt })
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700))

    const reply = getOsirisResponse(txt, activeGoal?.title)
    await supabase.from('chat_messages').insert({ user_id: user.id, role: 'osiris', content: reply })
    setChatHistory(h => [...h, { role: 'osiris', content: reply }])
    setChatLoading(false)
  }

  function startVoice(setter: React.Dispatch<React.SetStateAction<string>>) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input works in Chrome and Safari.'); return }
    const r = new SR()
    r.lang = 'en-US'; r.interimResults = false
    r.onresult = (e: any) => setter(p => (p ? p + ' ' : '') + e.results[0][0].transcript)
    r.onerror = () => alert('Microphone access needed.')
    r.start()
  }

  // ── Journal ───────────────────────────────────────────────────────────────
  function handleMedia(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { alert(`"${file.name}" is over 5 MB.`); return }
      const reader = new FileReader()
      reader.onload = ev => {
        const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio'
        setJMedia(p => [...p, { type: type as 'image' | 'video' | 'audio', name: file.name, data: ev.target!.result as string }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  async function saveJournal() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('reflections').insert({ user_id: user.id, content: jText || null, mood: jMood || null, task_id: null })
    setJSaved(true)
    setTimeout(() => setJSaved(false), 2500)
    showToast('Journal entry saved ✓')
  }

  function downloadJournal() {
    const today = new Date()
    const ds = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const moods: Record<string, string> = { Great: '😊', Calm: '😌', Focused: '🎯', Stressed: '😤', Tired: '😴', Low: '😔' }
    const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const mediaHtml = jMedia.map(m =>
      m.type === 'image' ? `<img src="${m.data}" alt="${esc(m.name)}" style="max-width:100%;margin:14px 0;border-radius:10px;display:block;">` :
      m.type === 'video' ? `<video controls style="max-width:100%;margin:14px 0;border-radius:10px;display:block;"><source src="${m.data}"></video>` :
      `<audio controls style="width:100%;margin:14px 0;display:block;"><source src="${m.data}"></audio>`
    ).join('\n')
    const stepsInfo = activeGoal ? `${activeGoal.current_step} of ${activeGoal.steps.length}` : '—'

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>GoalCoach Journal — ${today.toDateString()}</title>
<style>
@page{size:8.5in 11in;margin:1in}*{box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#2c2c2c;line-height:1.75;max-width:6.5in;margin:0 auto;background:#fff}
.header{border-bottom:2.5px solid #185FA5;padding-bottom:22px;margin-bottom:34px}
.logo{font-size:28px;font-weight:700;color:#171717}.logo em{color:#185FA5;font-style:normal}
.meta{font-size:13px;color:#888;margin-top:5px}
.section{margin-bottom:30px;page-break-inside:avoid}
h2{font-size:11px;font-weight:700;color:#185FA5;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px}
.mood{display:inline-flex;align-items:center;gap:8px;background:#f8f7f4;border:1px solid #e8e5df;border-radius:24px;padding:8px 18px;font-size:15px}
.body{font-size:15px;line-height:1.9;color:#333;background:#fafaf8;border-left:3.5px solid #185FA5;padding:18px 22px;border-radius:0 10px 10px 0;white-space:pre-wrap;word-wrap:break-word;min-height:72px}
.goal{background:#f0f5f0;border-radius:10px;padding:16px 20px}.goal strong{display:block;font-size:15px;color:#171717;margin-bottom:6px}
.stats{display:flex;gap:18px}.stat{flex:1;background:#f8f7f4;border-radius:10px;padding:16px 12px;text-align:center;border:1px solid #e8e5df}
.stat-n{font-size:24px;font-weight:700;color:#171717}.stat-l{font-size:11px;color:#888;margin-top:4px}
.safety{background:#fff8f0;border:1px solid #ffe0c0;border-radius:10px;padding:14px 18px;font-size:13px;color:#7a4f00;line-height:1.6;margin-bottom:30px}
.osiris{background:#f0f5f0;border:1px solid #dde8dd;border-radius:10px;padding:14px 18px;font-size:13px;color:#2a4a2e;line-height:1.6;margin-bottom:30px}
.footer{border-top:1px solid #e8e5df;margin-top:44px;padding-top:16px;font-size:11px;color:#bbb;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header"><div class="logo">Goal<em>Coach</em></div><div class="meta">Daily Journal · ${ds}</div><div class="meta">${esc(profile?.display_name ?? 'Family Member')}</div></div>
<div class="safety"><strong>⚠️ A reminder:</strong> If anything here feels heavy, please don't carry it alone. Call or text <strong>988</strong> (US, 24/7) · Text HOME to <strong>741741</strong> · <strong>findahelpline.com</strong></div>
<div class="osiris"><strong>✦ From Osiris:</strong> "Every page of this journal is evidence that you showed up. That matters more than you know."</div>
<div class="section"><h2>Mood</h2><div class="mood">${moods[jMood] ?? '•'} ${jMood || 'Not recorded today'}</div></div>
${activeGoal ? `<div class="section"><h2>Active Goal</h2><div class="goal"><strong>${esc(activeGoal.title)}</strong>${focusTask ? `<div>Today's focus: ${esc(focusTask.title)}</div>` : ''}<div style="margin-top:6px;font-size:13px;color:#4a7c5a">${stepsInfo} steps complete</div></div></div>` : ''}
<div class="section"><h2>Journal Entry</h2><div class="body">${jText ? esc(jText) : 'No entry written today.'}</div></div>
${jMedia.length ? `<div class="section"><h2>Photos &amp; Media (${jMedia.length})</h2>${mediaHtml}</div>` : ''}
<div class="section"><h2>Today's Stats</h2><div class="stats">
  <div class="stat"><div class="stat-n">🔥 ${activeGoal?.streak ?? 0}</div><div class="stat-l">day streak</div></div>
  <div class="stat"><div class="stat-n">${totalXp} XP</div><div class="stat-l">total earned</div></div>
  <div class="stat"><div class="stat-n">${stepsInfo}</div><div class="stat-l">steps done</div></div>
</div></div>
<div class="footer">GoalCoach · Your family's personal coaching companion · Printed ${today.toLocaleDateString()}<br><em>988 Lifeline (call/text, US) · Crisis Text Line: text HOME to 741741 · findahelpline.com</em></div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `goalcoach-journal-${today.toISOString().slice(0, 10)}.html`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    showToast('Journal downloaded ↓')
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: C.beige, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.dark }}>Goal<span style={{ color: C.blue }}>Coach</span></div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Loading…</div>
      </div>
    </div>
  )

  // ── ONBOARDING ────────────────────────────────────────────────────────────
  if (profile && !profile.onboarded) {
    const q = ONBOARD_QS[obStep]
    return (
      <div style={{ background: C.beige, minHeight: '100vh', fontFamily: 'Arial,sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 52 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Goal<span style={{ color: C.blue }}>Coach</span></div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Let's personalise your experience</div>
          <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 26, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: C.blue, borderRadius: 4, width: `${((obStep + 1) / ONBOARD_QS.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Question {obStep + 1} of {ONBOARD_QS.length}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 24, lineHeight: 1.3 }}>{q.q}</div>
          {q.opts.map(opt => {
            const sel = obAnswers[q.key] === opt
            return (
              <div key={opt} onClick={() => setObAnswers(a => ({ ...a, [q.key]: opt }))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: sel ? C.blueLight : C.white, border: `0.5px solid ${sel ? C.blue : C.border}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer', fontSize: 14, color: sel ? C.blue : '#333' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? C.blue : '#ccc'}`, background: sel ? C.blue : 'transparent', flexShrink: 0 }} />
                {opt}
              </div>
            )
          })}
          <button onClick={() => { if (!obAnswers[q.key]) return; obStep < ONBOARD_QS.length - 1 ? setObStep(s => s + 1) : finishOnboard() }}
            disabled={!obAnswers[q.key] || obSaving}
            style={{ width: '100%', height: 42, background: obAnswers[q.key] && !obSaving ? C.dark : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontFamily: 'Arial,sans-serif', cursor: obAnswers[q.key] ? 'pointer' : 'default', marginTop: 10 }}>
            {obSaving ? 'Saving…' : obStep < ONBOARD_QS.length - 1 ? 'Next →' : 'Meet Osiris →'}
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  const energyLabels = ['Very low 🌱', 'Low energy 🌱', 'Medium energy ⚡', 'High energy ⚡', 'Very high 🚀']
  const chartBases   = [34, 50, 58, 24, 54, 68, 44]
  const chartBoost   = Math.min(20, (activeGoal?.current_step ?? 0) * 3)
  const todayIdx     = (new Date().getDay() + 6) % 7

  return (
    <div style={{ background: tab === 'coach' ? C.sageBg : C.beige, minHeight: '100vh', maxWidth: 480, margin: '0 auto', fontFamily: 'Arial,sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: C.dark, color: '#fff', borderRadius: 20, padding: '8px 18px', fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {/* ── HOME ── */}
      {tab === 'home' && (
        <div style={{ padding: '20px 18px 90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 13, color: C.muted }}>Good day, {profile?.display_name?.split(' ')[0]} 👋</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginTop: 2 }}>Your one thing today</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, paddingTop: 8 }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>One step at a time, matched to your energy.</div>

          {/* Energy */}
          <div style={{ background: C.white, borderRadius: 14, padding: 16, border: `0.5px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>How's your energy right now?</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} onClick={() => setEnergy(n)} style={{ flex: 1, height: 14 + n * 11, borderRadius: '4px 4px 0 0', background: n <= energy ? C.coral : C.border, cursor: 'pointer', transition: 'all 0.15s' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.coral, fontWeight: 600 }}>{energyLabels[energy - 1]}</div>
          </div>

          {/* Task card */}
          {activeGoal && activeGoal.steps.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 14, padding: '24px 18px', border: `0.5px solid ${C.border}`, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Goal found — no step plan yet</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.55 }}>Your existing goal <strong>{activeGoal.title}</strong> doesn't have AI steps yet. Add a new goal to get a full plan.</div>
              <button onClick={() => setTab('goals')} style={{ height: 38, padding: '0 22px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Add a new goal</button>
            </div>
          ) : activeGoal && focusTask ? (
            <div style={{ background: C.white, borderRadius: 14, padding: '18px 16px', border: `0.5px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8 }}>STEP {activeGoal.current_step + 1} OF {activeGoal.steps.length}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, lineHeight: 1.4, marginBottom: 6 }}>{focusTask.title}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 4 }}>{focusTask.description}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Est. {focusTask.estimatedMinutes} min &nbsp;·&nbsp; {activeGoal.title.length > 44 ? activeGoal.title.slice(0, 44) + '…' : activeGoal.title}</div>
              {recalNote && <div style={{ fontSize: 12, color: C.sage, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>🌿 {recalNote}</div>}
              {aiMsg && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{aiMsg}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={completeStep} style={{ flex: 1, height: 40, background: C.dark, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>✓ Done</button>
                <button onClick={doRecalibrate} disabled={aiLoading} style={{ flex: 1, height: 40, background: C.white, color: C.dark, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>{aiLoading ? '…' : '⟳ Recalibrate'}</button>
              </div>
            </div>
          ) : (
            <div style={{ background: C.white, borderRadius: 14, padding: '30px 22px', border: `0.5px solid ${C.border}`, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>No active goal yet</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.55 }}>Add a goal and your plan will be built automatically.</div>
              <button onClick={() => setTab('goals')} style={{ height: 38, padding: '0 22px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Add your first goal</button>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[
              ['🔥 ' + (activeGoal?.streak ?? 0), 'day streak'],
              [totalXp + ' XP', 'earned'],
              [activeGoal ? `${activeGoal.current_step}/${activeGoal.steps.length}` : '—', 'steps done'],
            ].map(([n, l]) => (
              <div key={String(l)} style={{ flex: 1, background: C.white, borderRadius: 12, padding: '12px 8px', border: `0.5px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{n}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Weekly chart */}
          <div style={{ background: C.white, borderRadius: 14, padding: 16, border: `0.5px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>This week's activity</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 68, marginBottom: 6 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                <div key={d} style={{ flex: 1, height: Math.min(68, chartBases[i] + chartBoost), borderRadius: '4px 4px 0 0', background: i === todayIdx ? C.blue : i < todayIdx ? '#b8cfe0' : C.border }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} style={{ flex: 1, fontSize: 10, color: C.muted, textAlign: 'center' }}>{d}</div>
              ))}
            </div>
          </div>

          <button onClick={signOut} style={{ width: '100%', height: 36, background: 'transparent', color: C.muted, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Sign out</button>
        </div>
      )}

      {/* ── GOALS ── */}
      {tab === 'goals' && (
        <div style={{ padding: '20px 18px 90px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Your goals</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Type a goal — your action plan is built automatically.</div>

          <div style={{ background: C.white, borderRadius: 14, padding: 18, border: `0.5px solid ${C.border}`, marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 10 }}>Add a new goal</div>
            <textarea value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)}
              placeholder="e.g. Launch my freelance portfolio by end of next month…"
              style={{ width: '100%', border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Arial,sans-serif', background: C.light, resize: 'none', height: 84, outline: 'none', lineHeight: 1.55, marginBottom: 8 }} />
            <textarea value={newGoalDesc} onChange={e => setNewGoalDesc(e.target.value)}
              placeholder="Why does this matter to you? (optional)"
              style={{ width: '100%', border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Arial,sans-serif', background: C.light, resize: 'none', height: 60, outline: 'none', lineHeight: 1.55 }} />
            {aiMsg && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{aiMsg}</div>}
            <button onClick={addGoal} disabled={goalLoading || !newGoalTitle.trim()}
              style={{ width: '100%', height: 40, background: newGoalTitle.trim() && !goalLoading ? C.blue : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: newGoalTitle.trim() ? 'pointer' : 'default', marginTop: 10, fontFamily: 'Arial,sans-serif', fontWeight: 500 }}>
              {goalLoading ? 'Building your plan…' : 'Build my step plan →'}
            </button>
          </div>

          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 20px', color: C.muted, fontSize: 14 }}>No goals yet — add one above.</div>
          ) : goals.map(g => {
            const pct      = g.steps.length ? Math.round((g.current_step / g.steps.length) * 100) : 0
            const isActive = g.status === 'active'
            return (
              <div key={g.id} style={{ background: C.white, borderRadius: 14, padding: 18, border: `0.5px solid ${isActive ? C.blue : C.border}`, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, lineHeight: 1.3, flex: 1, marginRight: 10 }}>{g.title}</div>
                  {isActive && <div style={{ fontSize: 11, background: C.blueLight, color: C.blue, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', fontWeight: 700 }}>Active</div>}
                </div>
                {g.steps.length > 0 && <>
                  <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: pct === 100 ? C.sage : C.blue, borderRadius: 4, width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{g.current_step} of {g.steps.length} steps · {pct}%</div>
                  {g.steps.slice(0, 4).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: i < g.current_step ? C.blue : C.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {i < g.current_step && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 13, color: i < g.current_step ? C.muted : C.dark, textDecoration: i < g.current_step ? 'line-through' : 'none' }}>{s.title}</div>
                    </div>
                  ))}
                  {g.steps.length > 4 && <div style={{ fontSize: 12, color: C.muted, marginTop: 2, marginLeft: 26 }}>+{g.steps.length - 4} more steps</div>}
                </>}
                {!isActive && (
                  <button onClick={() => makeActive(g.id)} style={{ width: '100%', height: 34, background: 'transparent', color: C.blue, border: `0.5px solid ${C.blue}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', marginTop: 12, fontFamily: 'Arial,sans-serif' }}>
                    Set as active goal
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── COACH ── */}
      {tab === 'coach' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ background: C.white, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${C.sageBd}`, flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${C.sage}, ${C.sageDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, flexShrink: 0 }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.sageDark }}>Osiris</div>
              <div style={{ fontSize: 12, color: C.sageMid }}>CBT-informed coach · safe mode ✓</div>
            </div>
            <div style={{ fontSize: 10, color: C.sage, background: '#e6f4ea', borderRadius: 10, padding: '3px 10px', fontWeight: 600 }}>OFFLINE</div>
          </div>
          <div style={{ background: '#fff8f0', borderBottom: '0.5px solid #ffd8a8', padding: '8px 16px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#7a4f00', lineHeight: 1.5 }}>Osiris is a coaching tool — not a crisis service. Need urgent support? Call or text <strong>988</strong> · Text HOME to <strong>741741</strong></div>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '52px 24px', color: C.sageMid }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>✦</div>
                <div style={{ fontSize: 14 }}>Osiris is ready when you are.</div>
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} style={{ background: m.role === 'osiris' ? C.white : C.sageDark, color: m.role === 'osiris' ? '#2a3a2e' : '#fff', border: m.role === 'osiris' ? `0.5px solid ${C.sageBd}` : 'none', borderRadius: m.role === 'osiris' ? '4px 14px 14px 14px' : '14px 4px 14px 14px', padding: '12px 14px', fontSize: 14, lineHeight: 1.65, maxWidth: '84%', marginLeft: m.role === 'user' ? 'auto' : 0, whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ background: C.white, border: `0.5px solid ${C.sageBd}`, borderRadius: '4px 14px 14px 14px', padding: '12px 14px', fontSize: 14, color: C.sageMid, maxWidth: '52%' }}>Osiris is thinking… ✦</div>
            )}
          </div>
          <div style={{ background: C.white, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', borderTop: `0.5px solid ${C.sageBd}`, position: 'sticky', bottom: 58, flexShrink: 0 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Talk to Osiris…"
              style={{ flex: 1, height: 38, border: `0.5px solid ${C.sageBd}`, borderRadius: 20, padding: '0 14px', fontSize: 13, fontFamily: 'Arial,sans-serif', background: C.sageBg, outline: 'none' }} />
            <button onClick={() => startVoice(setChatInput)} style={{ width: 38, height: 38, background: C.sage, border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8"/></svg>
            </button>
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ width: 38, height: 38, background: C.sageDark, border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: chatLoading || !chatInput.trim() ? 0.45 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── JOURNAL ── */}
      {tab === 'journal' && (
        <div style={{ padding: '20px 18px 90px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Daily journal</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 10 }}>How are you feeling?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {[['Great','😊'],['Calm','😌'],['Focused','🎯'],['Stressed','😤'],['Tired','😴'],['Low','😔']].map(([label, emoji]) => (
              <div key={label} onClick={() => setJMood(label)} style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, border: `0.5px solid ${jMood === label ? C.blue : C.border}`, background: jMood === label ? C.blue : C.white, color: jMood === label ? '#fff' : '#555', cursor: 'pointer' }}>{emoji} {label}</div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 8 }}>What's on your mind?</div>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <textarea value={jText} onChange={e => setJText(e.target.value)} placeholder="Write freely — this is just for you…"
              style={{ width: '100%', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 14px 42px', fontSize: 14, fontFamily: 'Arial,sans-serif', background: C.white, resize: 'none', height: 144, outline: 'none', lineHeight: 1.65 }} />
            <button onClick={() => startVoice(setJText)} style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, background: '#f0ede8', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8"/></svg>
            </button>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 8 }}>Add photos, audio, or video</div>
          <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" onChange={handleMedia} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ width: '100%', height: 40, background: C.white, color: C.dark, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'Arial,sans-serif', cursor: 'pointer', marginBottom: 6 }}>📎 Attach files</button>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Max 5 MB per file · Images, audio &amp; video</div>

          {jMedia.map((m, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {m.type === 'image' && <img src={m.data} alt={m.name} style={{ width: '100%', borderRadius: 10, display: 'block' }} />}
              {m.type === 'video' && <video controls style={{ width: '100%', borderRadius: 10, display: 'block' }}><source src={m.data} /></video>}
              {m.type === 'audio' && <audio controls style={{ width: '100%', display: 'block' }}><source src={m.data} /></audio>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.name}</div>
                <button onClick={() => setJMedia(p => p.filter((_, j) => j !== i))} style={{ fontSize: 12, color: C.coral, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>Remove</button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <button onClick={saveJournal} style={{ flex: 1, height: 42, background: jSaved ? C.sage : C.dark, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontFamily: 'Arial,sans-serif', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}>
              {jSaved ? '✓ Saved!' : 'Save entry'}
            </button>
            <button onClick={downloadJournal} style={{ flex: 1, height: 42, background: C.white, color: C.blue, border: `0.5px solid ${C.blue}`, borderRadius: 8, fontSize: 14, fontFamily: 'Arial,sans-serif', cursor: 'pointer', fontWeight: 500 }}>↓ Download</button>
          </div>
          <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.65 }}>Opens in browser → File → Print → Save as PDF.</div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.white, borderTop: `0.5px solid ${C.border}`, display: 'flex', zIndex: 50 }}>
        {NAV.map(n => {
          const isActive = n.id === tab
          const color    = isActive ? (n.isOsiris ? C.sage : C.blue) : C.muted
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, height: 58, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontSize: n.isOsiris ? 22 : 20, color: n.isOsiris && isActive ? C.sage : 'inherit' }}>{n.emoji}</span>
              <span style={{ fontSize: 11, color, fontWeight: isActive ? 700 : 400, fontFamily: 'Arial,sans-serif' }}>{n.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
