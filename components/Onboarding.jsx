"use client"; // Required by Next.js for step toggles, form states, and click hooks

import { useState } from 'react'
import { Btn, DARK } from './ui' // Upgraded to Next.js path alias mapping

const QUIZ = [
  { id: 'name', q: "What's your name?", type: 'text', ph: 'Your first name' },
  {
    id: 'block', q: "What's your biggest challenge working toward goals?", type: 'choice',
    opts: [
      { v: 'procrastination', l: 'I keep putting things off' },
      { v: 'perfectionism', l: "I can't start until conditions feel right" },
      { v: 'overwhelm',     l: 'The size of the task freezes me' },
      { v: 'inconsistency', l: 'I start strong but lose momentum' },
    ],
  },
  {
    id: 'energy', q: 'When do you feel sharpest and most focused?', type: 'choice',
    opts: [
      { v: 'morning',   l: 'Morning (before noon)' },
      { v: 'afternoon', l: 'Afternoon (noon–5 pm)' },
      { v: 'evening',   l: 'Evening (after 5 pm)' },
      { v: 'variable',  l: 'It changes day to day' },
    ],
  },
  {
    id: 'motivation', q: 'What drives you most?', type: 'choice',
    opts: [
      { v: 'progress',       l: 'Seeing visible, measurable progress' },
      { v: 'purpose',        l: "Staying connected to my bigger 'why'" },
      { v: 'accountability', l: 'Having structure and checkpoints' },
      { v: 'rewards',        l: 'Earning points or recognition' },
    ],
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep]     = useState(0)
  const [answers, setAnswers] = useState({})
  const [text, setText]     = useState('')
  const [err, setErr]       = useState('')
  const q = QUIZ[step]

  function advance(val) {
    const next = { ...answers, [q.id]: val }
    setAnswers(next); setErr(''); setText('')
    if (step < QUIZ.length - 1) setStep(s => s + 1)
    else onComplete(next)
  }
  
  function submitText() {
    if (!text.trim()) { setErr('Please enter your name'); return }
    advance(text.trim())
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: DARK }}>Goal Coach</h1>
          <p style={{ color: '#666', fontSize: 15 }}>Let's set you up</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {QUIZ.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? DARK : '#e0ddd8', transition: 'background 0.3s' }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Question {step + 1} of {QUIZ.length}</p>
        <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, marginBottom: '1.5rem', color: DARK }}>{q.q}</h2>

        {q.type === 'text' && (
          <div>
            <input autoFocus value={text} placeholder={q.ph}
              onChange={e => { setText(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && submitText()}
              style={{ width: '100%', padding: '12px', border: '1px solid #e0ddd8', borderRadius: 10, fontSize: 15, outline: 'none' }} />
            {err && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{err}</p>}
            <Btn variant="primary" onClick={submitText} style={{ marginTop: 14 }} full>Continue →</Btn>
          </div>
        )}

        {q.type === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map(o => (
              <button key={o.v} onClick={() => advance(o.v)} style={{
                padding: '14px 18px', borderRadius: 12, textAlign: 'left',
                background: '#fff', border: '1px solid #e0ddd8',
                fontSize: 15, cursor: 'pointer', color: DARK,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = DARK; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e0ddd8'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}
        <p style={{ marginTop: '2rem', fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
          Your answers personalise your coaching experience.
        </p>
      </div>
    </div>
  )
}
