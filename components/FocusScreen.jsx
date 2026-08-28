"use client";

import { useState } from 'react'
import { createClient } from '../lib/supabase'
import { Btn, Card, Pill, DARK, CORAL, GREEN } from './ui'

export default function FocusScreen({ initialGoals, onRefreshGoals }) {
  const supabase = createClient();
  const [energyLevel, setEnergyLevel] = useState(3);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc]   = useState("");
  const [creating, setCreating]         = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");

  async function handleAddGoal(e) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setCreating(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("Please sign in first.");
      setCreating(false);
      return;
    }

    // Insert to database matching your exact column fields verified in app/page.tsx
    const { error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: newGoalTitle.trim(),
        description: newGoalDesc.trim() || null,
        status: "pending"
      });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setNewGoalTitle("");
      setNewGoalDesc("");
      if (onRefreshGoals) onRefreshGoals();
    }
    setCreating(false);
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Metrics Header Dashboard Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
        <Card style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Active Commitments</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: DARK }}>{initialGoals.length}</p>
        </Card>
        <Card style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Focus Energy</p>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: '24px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div 
                key={n} 
                onClick={() => setEnergyLevel(n)}
                style={{ 
                  width: 10, 
                  height: 18, 
                  borderRadius: 3, 
                  cursor: 'pointer', 
                  background: n <= energyLevel ? CORAL : '#e8e5e0', 
                  transition: 'background 0.15s' 
                }} 
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Interactive Goal Creator Input Form block */}
      <Card style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: DARK }}>✨ Add a New Commitment Goal</h3>
        <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="What is your focus goal? (e.g. Build landing page)" 
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <input 
            type="text" 
            placeholder="Short description or context (optional)" 
            value={newGoalDesc}
            onChange={(e) => setNewGoalDesc(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <button 
            type="submit" 
            disabled={creating || !newGoalTitle.trim()}
            style={{ padding: '10px', background: DARK, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            {creating ? "Saving commitment..." : "Commit to Goal"}
          </button>
          {errorMsg && <p style={{ color: 'red', fontSize: '13px', margin: '4px 0 0 0' }}>{errorMsg}</p>}
        </form>
      </Card>

      {/* Complete Current Active Commitments Feed Tracker */}
      <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>
        Your Active Commitments
      </p>
      
      {initialGoals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed #ccc', borderRadius: '12px', color: '#666' }}>
          No commitment goals tracking yet. Add one above to begin!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {initialGoals.map((goal) => (
            <Card key={goal.id} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: goal.description ? '6px' : '0' }}>
                <strong style={{ color: DARK, fontSize: '15px' }}>{goal.title}</strong>
                <Pill color={GREEN}>{goal.status || "active"}</Pill>
              </div>
              {goal.description && (
                <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: 1.4 }}>{goal.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
