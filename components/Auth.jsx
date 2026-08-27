"use client"; // Required by Next.js for form submissions and state hooks

import { useState } from 'react'
import { createClient } from '../lib/supabase' // Safely points to root lib folder
import { Btn, DARK } from './ui' // Clean sibling directory mapping

export default function Auth() {
  const supabase = createClient() // Instantiate the client inside the component container
  
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', padding: 40, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: DARK }}>Goal Coach</h1>
          <p style={{ color: '#666', fontSize: 16, marginTop: 6 }}>Make progress one thing at a time.</p>
        </div>

        <h2 style={{ marginBottom: 6, fontSize: 20 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
          {mode === 'login' ? "Let's keep moving forward." : 'Join your family coaching space.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Email</label>
          <input type="email" value={email} required onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com" style={{ marginBottom: 16, width: '100%', padding: '10px', border: '1px solid #e0ddd8', borderRadius: 8, outline: 'none' }} />

          <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Password</label>
          <input type="password" value={password} required minLength={6}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters" style={{ marginBottom: 20, width: '100%', padding: '10px', border: '1px solid #e0ddd8', borderRadius: 8, outline: 'none' }} />

          {error   && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, lineHeight: 1.5 }}>{error}</p>}
          {message && <p style={{ fontSize: 13, color: GREEN, marginBottom: 12, lineHeight: 1.5 }}>{message}</p>}

          <Btn variant="primary" full disabled={loading}>
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Btn>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 }}>
            {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

const GREEN = '#1D9E75'
