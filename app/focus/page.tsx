"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";
import FocusScreen from "../../components/FocusScreen";
import { DARK, CORAL } from "../../components/ui";

type Task = {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: string;
};

type Goal = {
  id: string;
  title: string;
  steps?: string[];
  current_step?: number;
  xp?: number;
  streak?: number;
};

export default function FocusPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"today" | "commitments">("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [completing, setCompleting] = useState(false);

  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionMood, setReflectionMood] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const [todayState, setTodayState] = useState({
    focus_goal_id: "",
    focus_step_override: null,
    energy_level: 3,
    completed: false,
    ai_reframe: ""
  });

  async function loadFocusTask() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in first.");
      setLoading(false);
      return;
    }

    const { data: goalData, error: goalError } = await supabase
      .from("goals")
      .select("id, title, steps, current_step, xp, streak")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (goalError) {
      setMessage(goalError.message);
      setLoading(false);
      return;
    }

    const typedGoals = (goalData || []).map(g => ({
      ...g,
      steps: Array.isArray(g.steps) ? g.steps : []
    }));

    setGoals(typedGoals);

    if (typedGoals.length > 0) {
      setTodayState(prev => ({ ...prev, focus_goal_id: typedGoals[0].id }));
    }

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("id, goal_id, title, description, status")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .order("created_at", { ascending: true })
      .limit(1);

    if (taskError) {
      setMessage(taskError.message);
      setLoading(false);
      return;
    }

    setTasks(taskData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadFocusTask();
  }, []);

  async function handleComplete(task: Task) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in first.");
      return;
    }

    setCompleting(true);
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setCompleting(false);
      return;
    }

    const { error: xpError } = await supabase
      .from("xp")
      .insert({
        user_id: user.id,
        amount: 10,
        reason: "task_completed",
        task_id: task.id,
      });

    if (xpError) {
      setMessage(`Task completed, but XP could not be saved: ${xpError.message}`);
      setCompleting(false);
      return;
    }

    setTasks([]);
    setCompletedTask(task);
    setMessage("");
    setCompleting(false);
  }

  async function handleSaveReflection() {
    if (!completedTask) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please sign in first.");
      return;
    }

    if (!reflectionText.trim()) {
      setMessage("Please write a short reflection.");
      return;
    }

    setReflectionLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("reflections")
      .insert({
        user_id: user.id,
        task_id: completedTask.id,
        content: reflectionText.trim(),
        mood: reflectionMood || null,
      });

    if (error) {
      setMessage(`Could not save reflection: ${error.message}`);
      setReflectionLoading(false);
      return;
    }

    setReflectionText("");
    setReflectionMood("");
    setReflectionSaved(true);
    setMessage("Reflection saved! 💭");
    setReflectionLoading(false);
  }

  const saveToday = async (updatedToday: any) => {
    setTodayState(updatedToday);
  };

  const saveGoals = async (updatedGoals: any) => {
    setGoals(updatedGoals);
  };

  const currentTask = tasks.length > 0 ? tasks[0] : null;

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
        <p style={{ color: "#666" }}>Loading your focus...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        
        <button type="button" onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", padding: 0, color: "#666", cursor: "pointer", fontSize: "14px", marginBottom: "25px", textDecoration: "underline" }}>
          ← Back to Goal Coach
        </button>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #e2e1dc", paddingBottom: "12px" }}>
          <button onClick={() => setActiveTab("today")} style={{ padding: "10px 18px", background: activeTab === "today" ? DARK : "transparent", color: activeTab === "today" ? "#ffffff" : "#555555", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "all 0.15s ease" }}>
            🎯 Today's Focus
          </button>
          <button onClick={() => setActiveTab("commitments")} style={{ padding: "10px 18px", background: activeTab === "commitments" ? DARK : "transparent", color: activeTab === "commitments" ? "#ffffff" : "#555555", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "all 0.15s ease" }}>
            📋 Commitments
          </button>
        </div>

        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          {activeTab === "today" && (
            <div>
              <p style={{ color: "#777", fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>ONE-THING FOCUS</p>
              <h1 style={{ fontSize: "36px", marginTop: 0, marginBottom: "10px" }}>Today's focus</h1>
              <p style={{ color: "#666", fontSize: "17px", lineHeight: 1.5 }}>
                You don't need to do everything today.<br />Just focus on one small step.
              </p>
              <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "30px 0" }} />

              {!currentTask && completedTask && !reflectionSaved ? (
                <div>
                  <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
                    <div style={{ fontSize: "42px", marginBottom: "10px" }}>🎉</div>
                    <h2 style={{ marginTop: 0, marginBottom: "8px" }}>You did it!</h2>
                    <p style={{ color: "#666", lineHeight: 1.5, margin: 0 }}>Take a moment to notice how that went.</p>
                  </div>
                  <div style={{ background: "#f8f7f4", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                    <strong>{completedTask.title}</strong>
                  </div>
                  <label htmlFor="focusReflection" style={{ display: "block", marginBottom: "8px" }}>How did it go?</label>
                  <textarea id="focusReflection" value={reflectionText} onChange={(e) => setReflectionText(e.target.value)} style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "15px", boxSizing: "border-box" }} />
                  <button onClick={handleSaveReflection} disabled={reflectionLoading} style={{ width: "100%", padding: "12px", background: DARK, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    {reflectionLoading ? "Saving..." : "Save Reflection"}
                  </button>
                </div>
              ) : currentTask ? (
                <div>
                  <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>{currentTask.title}</h3>
                  {currentTask.description && <p style={{ color: "#555", marginBottom: "20px" }}>{currentTask.description}</p>}
                  <button onClick={() => handleComplete(currentTask)} disabled={completing} style={{ padding: "12px 24px", background: CORAL, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                    {completing ? "Completing..." : "Complete Task"}
                  </button>
                </div>
              ) : (
                <p style={{ color: "#666" }}>All tasks complete for today! Check your commitments tab.</p>
              )}
              {message && <p style={{ color: "red", marginTop: "10px" }}>{message}</p>}
            </div>
          )}

          {activeTab === "commitments" && (
            <FocusScreen profile={{}} goals={goals} today={todayState} saveToday={saveToday} saveGoals={saveGoals} />
          )}
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState } from 'react'
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
  const [aiLoading, setAiLoading] = useState(false)
  const [flash, setFlash]         = useState(false)

  const activeGoal = goals.find(g => g.id === today.focus_goal_id) || goals[0]
  const stepIdx    = today.focus_step_override ?? activeGoal?.current_step ?? 0
  const focusStep  = activeGoal?.steps?.[stepIdx]
  const totalXP    = goals.reduce((s, g) => s + (g.xp || 0), 0)
  const maxStreak  = goals.reduce((m, g) => Math.max(m, g.streak || 0), 0)

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
        ? { ...g, xp: (g.xp || 0) + 10 + bonus, streak: (g.streak || 0) + 1, current_step: nextStep, last_completed: new Date().toDateString() }
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
        <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <i className="ti ti-target" style={{ fontSize: 44, color: '#ccc', display: 'block', marginBottom: 14 }} />
          <p style={{ color: '#888', fontSize: 15 }}>Add a goal to get your first focus step</p>
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
