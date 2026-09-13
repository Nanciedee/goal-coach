'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { generateGoalSteps, recalibrateStep } from '@/lib/goal-generator'
import { getOsirisResponse } from '@/lib/cbt-engine'
import type { Profile, Goal, GoalStep, ChatMessage } from '@/lib/types'

interface GoalCoachContextValue {
  profile: Profile | null
  goals: Goal[]
  activeGoal: Goal | null
  chatHistory: ChatMessage[]
  energy: number
  loading: boolean
  setEnergy: (n: number) => void
  addGoal: (title: string, description: string) => Promise<void>
  completeStep: () => Promise<void>
  recalibrate: () => Promise<void>
  setActiveGoal: (goalId: string) => Promise<void>
  sendChatMessage: (text: string) => Promise<void>
  refreshProfile: () => Promise<void>
  totalXp: number
}

const GoalCoachContext = createContext<GoalCoachContextValue | null>(null)

export function GoalCoachProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeGoal, setActiveGoalState] = useState<Goal | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [energy, setEnergyState] = useState(3)
  const [totalXp, setTotalXp] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [
      { data: prof },
      { data: gs },
      { data: msgs },
      { data: xpRows },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('xp').select('amount').eq('user_id', user.id),
    ])

    setProfile(prof)
    setGoals(gs ?? [])
    setChatHistory((msgs ?? []).map(m => ({ role: m.role as 'user' | 'osiris', content: m.content })))
    setTotalXp((xpRows ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0))

    // Set active goal — first active one found
    const active = (gs ?? []).find(g => g.status === 'active') ?? null
    setActiveGoalState(active)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const refreshProfile = useCallback(async () => { await load() }, [load])

  const setEnergy = useCallback((n: number) => {
    setEnergyState(n)
  }, [])

  const addGoal = useCallback(async (title: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const steps = generateGoalSteps(title)

    // Set any current active goal to pending
    if (activeGoal) {
      await supabase.from('goals').update({ status: 'pending' }).eq('id', activeGoal.id)
    }

    const { data: goal } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        description,
        status: 'active',
        steps,
        current_step: 1,
        xp: 0,
        streak: 0,
      })
      .select()
      .single()

    if (!goal) return
    setGoals(prev => [...prev.map(g => ({ ...g, status: 'pending' as const })), goal])
    setActiveGoalState(goal)
  }, [activeGoal])

  const completeStep = useCallback(async () => {
    if (!activeGoal) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const steps = activeGoal.steps as GoalStep[]
    const nextStep = activeGoal.current_step + 1
    const isComplete = nextStep > steps.length
    const newXp = (activeGoal.xp ?? 0) + 50
    const newStreak = (activeGoal.streak ?? 0) + 1

    await supabase.from('goals').update({
      current_step: isComplete ? activeGoal.current_step : nextStep,
      status: isComplete ? 'completed' : 'active',
      xp: newXp,
      streak: newStreak,
    }).eq('id', activeGoal.id)

    // Log XP
    await supabase.from('xp').insert({
      user_id: user.id,
      amount: 50,
      reason: 'task_completed',
      task_id: activeGoal.id,
    })

    setTotalXp(prev => prev + 50)
    setActiveGoalState(prev => prev ? {
      ...prev,
      current_step: isComplete ? prev.current_step : nextStep,
      status: isComplete ? 'completed' : 'active',
      xp: newXp,
      streak: newStreak,
    } : null)
    setGoals(prev => prev.map(g => g.id === activeGoal.id ? {
      ...g,
      current_step: isComplete ? g.current_step : nextStep,
      status: isComplete ? 'completed' : 'active',
      xp: newXp,
      streak: newStreak,
    } : g))
  }, [activeGoal])

  const recalibrate = useCallback(async () => {
    if (!activeGoal) return
    const steps = activeGoal.steps as GoalStep[]
    const result = recalibrateStep(steps, activeGoal.current_step - 1, energy)
    if (!result) return

    await supabase.from('goals').update({
      current_step: result.step.step,
    }).eq('id', activeGoal.id)

    setActiveGoalState(prev => prev ? { ...prev, current_step: result.step.step } : null)
    setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, current_step: result.step.step } : g))

    return result.reason
  }, [activeGoal, energy])

  const setActiveGoal = useCallback(async (goalId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Set all goals to pending first
    await supabase.from('goals').update({ status: 'pending' }).eq('user_id', user.id)
    // Set selected to active
    await supabase.from('goals').update({ status: 'active' }).eq('id', goalId)

    setGoals(prev => prev.map(g => ({
      ...g,
      status: g.id === goalId ? 'active' : 'pending',
    })))
    const newActive = goals.find(g => g.id === goalId) ?? null
    setActiveGoalState(newActive ? { ...newActive, status: 'active' } : null)
  }, [goals])

  const sendChatMessage = useCallback(async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: text,
    })

    setChatHistory(prev => [...prev, { role: 'user', content: text }])

    // Simulate Osiris thinking
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700))

    const reply = getOsirisResponse(text, activeGoal?.title)

    // Save Osiris reply
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'osiris',
      content: reply,
    })

    setChatHistory(prev => [...prev, { role: 'osiris', content: reply }])
  }, [activeGoal])

  return (
    <GoalCoachContext.Provider value={{
      profile, goals, activeGoal, chatHistory,
      energy, loading, totalXp,
      setEnergy, addGoal, completeStep, recalibrate,
      setActiveGoal, sendChatMessage, refreshProfile,
    }}>
      {children}
    </GoalCoachContext.Provider>
  )
}

export function useGoalCoach() {
  const ctx = useContext(GoalCoachContext)
  if (!ctx) throw new Error('useGoalCoach must be used inside <GoalCoachProvider>')
  return ctx
}
