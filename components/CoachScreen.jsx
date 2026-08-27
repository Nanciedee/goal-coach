"use client"; 

import { useState, useEffect, useRef } from 'react'
import { BLUE, CORAL, GREEN, GREENLT, GREENBDR, GREENDARK } from '@/components/ui' 

const STARTERS = ["I'm feeling stuck today", "I keep avoiding this task", "I'm being too hard on myself", "I don't know where to begin"]

// Local CBT Response Guidebook (No AI needed)
const LOCAL_RESPONSES = {
  procrastination: [
    "I hear you. When we feel overwhelmed, our brain tries to protect us by avoiding the task completely. Can we break this down into a single step that takes less than 2 minutes?",
    "That makes total sense. Procrastination isn't about laziness; it's about managing uncomfortable emotions around the task. What is the absolute smallest thing you could do right now?",
    "Validation is key here—it's okay to feel stuck. Action creates motivation, not the other way around. What if you just opened the file or put your shoes on without promising to finish it?"
  ],
  perfectionism: [
    "It sounds like that all-or-nothing thinking is creeping in. Remember, a messy attempt makes more progress than a perfect plan that never leaves your head. Can we aim for 'good enough' today?",
    "Be gentle with yourself. Perfectionism sets a bar so high that it paralyzes us. What would this task look like if it was allowed to be a little rough around the edges?",
    "I completely understand. Let's try to reframe this: failure is just data, not a reflection of your worth. What is one small, imperfect step you can take right now?"
  ],
  overwhelm: [
    "Take a deep breath. When everything feels important, nothing is. Let's practice radical simplification: look at your list and pick just ONE thing. Ignore everything else for now.",
    "Decision fatigue is very real. Your brain is running too many background apps right now. Let's close them out—what is the single next physical action you need to take?",
    "I'm right here with you. When overwhelm strikes, shrink the timeline. Don't think about the whole week or even the whole day. What can you do in just the next 10 minutes?"
  ],
  inconsistency: [
    "Fluctuations in motivation are completely natural—nobody stays fired up 24/7. Rely on your system instead of your feelings today. What small routine can we trigger?",
    "It's okay if you missed a day or a habit gap occurred. The secret to consistency isn't never stopping; it's just restarting quickly. How can we make today a tiny win?",
    "Progress isn't a straight line. Let's build momentum back up with a micro-action. What is a version of your goal that is so ridiculously easy you can't say no to it?"
  ]
};

function AriaAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: GREENBDR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className="ti ti-leaf" style={{ fontSize: 14, color: GREENDARK }} />
    </div>
  )
}

export default function CoachScreen({ profile, chatHistory, saveChat }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, loading])

  // Get user's block category or default to overwhelm layout
  const userBlock = profile?.block || 'overwhelm';

  async function send() {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    
    // 1. Add user message to local array
    const hist = [...chatHistory, { role: 'user', content: msg }]
    await saveChat(hist)
    
    // 2. Trigger a brief visual typing delay for realism
    setLoading(true)
    
    setTimeout(async () => {
      // 3. Pick a smart local response from our matrix based on their profile challenge
      const pool = LOCAL_RESPONSES[userBlock] || LOCAL_RESPONSES['overwhelm'];
      
      // Cycle through responses based on chat history length so they don't get the same reply back-to-back
      const responseIndex = Math.floor(hist.length / 2) % pool.length;
      const localReply = pool[responseIndex];

      // 4. Append Aria's safe local reply to the interface timeline
      await saveChat([...hist, { role: 'assistant', content: localReply }]);
      setLoading(false)
    }, 1000); // 1-second dynamic typing effect
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
              Hi {profile?.name || 'there'} — I'm Aria. This is your space to think out loud without judgment. What's keeping you from moving forward today?
            </div>
          </div>
        )}

        {/* Chat Log History */}
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

      {/* Input controls layout */}
      <div style={{ background: GREENLT, borderTop: `1px solid ${GREENBDR}`, padding: '12px 1.5rem 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} placeholder="Talk with Aria..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
            style={{ border: `1px solid ${GREENBDR}`, background: 'white', fontSize: 14, flex: 1, padding: '0 12px', borderRadius: 8, height: 40 }} />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            background: GREEN, color: 'white', border: 'none', borderRadius: 10,
            padding: '0 20px', height: 40, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="ti ti-send" style={{ fontSize: 15 }} />
          </button>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={() => saveChat([])} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#639922', textDecoration: 'underline' }}>
            Clear conversation
          </button>
        )}
      </div>
    </div>
  )
}
