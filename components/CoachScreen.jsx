"use client"; // Required by Next.js for local hooks, audio interaction, and scroll ref tracking

import { useState, useEffect, useRef } from 'react'
import { BLUE, CORAL, GREEN, GREENLT, GREENBDR, GREENDARK } from '@/components/ui' // Path updated to Next.js alias

const BLOCKS = {
  procrastination: 'task paralysis and avoidance',
  perfectionism:   'perfectionism and all-or-nothing thinking',
  overwhelm:       'cognitive overwhelm and decision fatigue',
  inconsistency:   'motivation fluctuation and habit gaps',
}

function AriaAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: GREENBDR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className="ti ti-leaf" style={{ fontSize: 14, color: GREENDARK }} />
    </div>
  )
}

const STARTERS = ["I'm feeling stuck today", "I keep avoiding this task", "I'm being too hard on myself", "I don't know where to begin"]

export default function CoachScreen({ profile, chatHistory, saveChat }) {
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const recogRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, loading])

  const SYS = `You are Aria, a warm and skilled CBT coach helping a family achieve their goals. You specialise in ${BLOCKS[profile?.block] || 'self-limiting patterns'}.
User energy peaks: ${profile?.energy || 'variably'}. Motivated by: ${profile?.motivation || 'progress'}.
Be brief (3–5 sentences). Warm and direct. Validate first, then gently challenge. Ask one question. Offer one micro-action when helpful. Never clinical or cold.`

  async function send() {
    if (!input.trim() || loading) return
    const msg  = input.trim()
    setInput('')
    const hist = [...chatHistory, { role: 'user', content: msg }]
    await saveChat(hist)
    setLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYS, user: msg, history: chatHistory.map(m => ({ role: m.role, content: m.content })) }),
      })
      const { text } = await res.json()
      await saveChat([...hist, { role: 'assistant', content: text }])
    } catch {
      await saveChat([...hist, { role: 'assistant', content: "I'm having trouble connecting right now. Try again in a moment." }])
    }
    setLoading(false)
  }

  function toggleVoice() {
    // Wrapped in a typeof window check to safeguard server execution checks during compilation
    if (typeof window === 'undefined') return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input not supported in this browser. Try Chrome.'); return }
    if (listening) { recogRef.current?.stop(); setListening(false); return }
    const r = new SR()
    r.continuous = false; r.interimResults = false
    r.onresult = e => { setInput(p => p + e.results[0][0].transcript); setListening(false) }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    recogRef.current = r; r.start(); setListening(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: GREENLT }}>

      {/* Aria header */}
      <div style={{ background: GREENLT, padding: '14px 1.5rem 12px', borderBottom: `1px solid ${GREENBDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: GREENDARK }}>Aria</p>
          <p style={{ fontSize: 12, color: '#639922' }}>Your CBT coach · here for you</p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: GREENBDR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-leaf" style={{ fontSize: 20, color: GREENDARK }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        {/* Quick starters */}
        {chatHistory.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            {STARTERS.map(s => (
              <button key={s} onClick={() => setInput(s)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, background: 'white',
                color: '#3B6D11', border: `1px solid ${GREENBDR}`, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Welcome */}
        {chatHistory.length === 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <AriaAvatar />
            <div style={{ maxWidth: '84%', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', background: 'white', border: `1px solid ${GREENBDR}`, fontSize: 14, lineHeight: 1.7, color: GREENDARK }}>
              Hi {profile?.name || 'there'} — I'm Aria. This is your space to think out loud. What's weighing on you today?
            </div>
          </div>
        )}

        {/* Chat */}
        {chatHistory.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '80%', padding: '12px 14px', borderRadius: '16px 16px 4px 16px', background: '#171717', fontSize: 14, lineHeight: 1.7, color: 'white' }}>
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <AriaAvatar />
              <div style={{ maxWidth: '84%', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', background: 'white', border: `1px solid ${GREENBDR}`, fontSize: 14, lineHeight: 1.7, color: GREENDARK }}>
                {m.content}
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <AriaAvatar />
            <div style={{ padding: '12px 14px', borderRadius: '16px 16px 16px 4px', background: 'white', border: `1px solid ${GREENBDR}`, display: 'flex', gap: 5, alignItems: 'center' }}>
              {[1, 0.6, 0.3].map((o, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#97C459', opacity: o }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: GREENLT, borderTop: `1px solid ${GREENBDR}`, padding: '12px 1.5rem 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleVoice} style={{
            padding: '10px 13px', borderRadius: 10, border: `1px solid ${GREENBDR}`,
            background: listening ? CORAL : 'white', color: listening ? 'white' : '#3B6D11', cursor: 'pointer',
          }}>
            <i className={`ti ti-microphone${listening ? '-off' : ''}`} style={{ fontSize: 17 }} />
          </button>
          <input value={input} placeholder="Share what's on your mind…"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
            style={{ border: `1px solid ${GREENBDR}`, background: 'white', fontSize: 14, flex: 1, padding: '0 10px', borderRadius: 8 }} />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            background: GREEN, color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 16px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}>
            <i className="ti ti-send" style={{ fontSize: 15 }} />
          </button>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={() => saveChat([])} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#639922' }}>
            Clear conversation
          </button>
        )}
      </div>
    </div>
  )
}
