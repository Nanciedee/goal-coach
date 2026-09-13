
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/focus')
      else setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else {
        setMessage('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/focus')
    }
    setLoading(false)
  }

  if (checking) return (
    <main style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <p style={{ color: '#888' }}>Loading…</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', margin: 0, color: '#171717', fontWeight: 700 }}>
            Goal<span style={{ color: '#185FA5' }}>Coach</span>
          </h1>
          <p style={{ color: '#888', fontSize: '15px', marginTop: '6px' }}>
            Your family's personal coaching companion
          </p>
        </div>

        <div style={{ display: 'flex', border: '0.5px solid #e8e5df', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage('') }}
              style={{ flex: 1, height: '36px', background: mode === m ? '#171717' : 'transparent', color: mode === m ? '#fff' : '#888', border: 'none', fontSize: '13px', fontFamily: 'Arial, sans-serif', cursor: 'pointer' }}>
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="you@example.com"
            style={{ width: '100%', height: '38px', border: '0.5px solid #e8e5df', borderRadius: '8px', padding: '0 12px', fontSize: '14px', fontFamily: 'Arial, sans-serif', background: '#fafaf8', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            placeholder="••••••••"
            style={{ width: '100%', height: '38px', border: '0.5px solid #e8e5df', borderRadius: '8px', padding: '0 12px', fontSize: '14px', fontFamily: 'Arial, sans-serif', background: '#fafaf8', marginBottom: '18px', outline: 'none', boxSizing: 'border-box' }} />

          {message && (
            <div style={{ fontSize: '13px', color: message.includes('created') ? '#4a7c5a' : '#D85A30', marginBottom: '12px', lineHeight: 1.5, padding: '10px', background: '#f8f8f8', borderRadius: '8px' }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '40px', background: loading ? '#999' : '#171717', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial, sans-serif', cursor: loading ? 'default' : 'pointer', fontWeight: 500 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  )
}
