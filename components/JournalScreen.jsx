"use client"; // Required by Next.js for interactive text inputs and form states

import { useState } from 'react'
import { Btn, Card, DARK, GREEN } from '@/components/ui'

const MOODS = [
  { emoji: '💪', label: 'Energized' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🎯', label: 'Focused' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '⏳', label: 'Stuck' },
]

export default function JournalScreen({ today, saveToday }) {
  const [entry, setEntry] = useState(today?.journal_entry || '')
  const [selectedMood, setSelectedMood] = useState(today?.mood || '')
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  async function handleSaveJournal(e) {
    e.preventDefault()
    setIsSaving(true)
    setSavedMessage('')

    try {
      // Saves directly to your unified profile daily logger state helper
      await saveToday({
        ...today,
        journal_entry: entry.trim(),
        mood: selectedMood,
      })
      setSavedMessage('Journal entry saved successfully! 📝')
    } catch (err) {
      setSavedMessage('Could not save entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '1.25rem', color: '#171717' }}>
        Daily Journal
      </h2>

      <Card>
        <form onSubmit={handleSaveJournal} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#333' }}>
              How did your day go?
            </label>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              Take a brief minute to log your milestones, habits, or observations.
            </p>
            <textarea
              value={entry}
              onChange={(e) => { setEntry(e.target.value); setSavedMessage(''); }}
              placeholder="What did you make progress on today? What went well?"
              style={{
                width: '100%',
                height: '140px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e0ddd8',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Current Vibe / Mood
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MOODS.map((m) => {
                const isActive = selectedMood === m.label
                return (
                  <button
                    type="button"
                    key={m.label}
                    onClick={() => { setSelectedMood(m.label); setSavedMessage(''); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: isActive ? `2px solid ${DARK}` : '1px solid #e0ddd8',
                      background: isActive ? '#f0efec' : '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.1s ease'
                    }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {savedMessage && (
            <p style={{ fontSize: 13, color: savedMessage.includes('saved') ? GREEN : '#dc2626', margin: 0 }}>
              {savedMessage}
            </p>
          )}

          <Btn variant="primary" full disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Daily Entry ✔'}
          </Btn>
        </form>
      </Card>
    </div>
  )
}
