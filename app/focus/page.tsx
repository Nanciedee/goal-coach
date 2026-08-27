"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

// Import your custom components
import Auth from "../../components/Auth";
import GoalsScreen from "../../components/GoalsScreen";
import CoachScreen from "../../components/CoachScreen";
import JournalScreen from "../../components/JournalScreen";
import ProgressScreen from "../../components/ProgressScreen";
import NavBar from "../../components/NavBar";
import { DARK } from "../../components/ui";

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
};

const TODAY = new Date().toDateString();

const DEFAULT_TODAY = {
  date: TODAY,
  energy_level: 3,
  focus_goal_id: null,
  focus_step_override: null,
  completed: false,
  journal_entry: "",
  mood: null,
  ai_reframe: null,
};

export default function FocusPage() {
  const supabase = createClient();

  // ── Multi-Screen Dashboard State ───────────────────────────
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [goalsState, setGoalsState] = useState<any[]>([]);
  const [today, setToday] = useState<any>(DEFAULT_TODAY);
  const [chat, setChat] = useState<any[]>([]);
  const [screen, setScreen] = useState("focus");
  const [globalLoading, setGlobalLoading] = useState(true);

  // ── Focus Page Active Task State ───────────────────────────
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

  // ── Unified Initial Data Sync ──────────────────────────────
  async function loadDashboardAndTasks(uid: string) {
    setGlobalLoading(true);
    setLoading(true);
    setMessage("");

    try {
      const [{ data: prof }, { data: gls }, { data: log }, { data: msgs }, { data: taskData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase.from("goals").select("*").eq("user_id", uid).order("created_at"),
        supabase.from("daily_logs").select("*").eq("user_id", uid).eq("date", TODAY).single(),
        supabase.from("chat_messages").select("*").eq("user_id", uid).order("created_at").limit(40),
        supabase.from("tasks").select("id, goal_id, title, description, status").eq("user_id", uid).neq("status", "completed").order("created_at", { ascending: true }).limit(1)
      ]);

      if (prof) setProfile(prof);
      if (gls) {
        setGoalsState(gls);
        setGoals(gls || []);
      }
      if (log) setToday(log);
      if (msgs) setChat(msgs);
      if (taskData) setTasks(taskData || []);

    } catch (err: any) {
      setMessage("Failed to load application data context.");
    } finally {
      setGlobalLoading(false);
      setLoading(false);
    }
  }

  // ── Isolated Core Authentication Observer ──────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadDashboardAndTasks(currentSession.user.id);
      } else {
        setGlobalLoading(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadDashboardAndTasks(currentSession.user.id);
      } else {
        setProfile(null);
        setGoalsState([]);
        setTasks([]);
        setGlobalLoading(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Core Task Actions ──────────────────────────────────────
  async function handleComplete(task: Task) {
    if (!session?.user) return;
    setCompleting(true);
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", task.id)
      .eq("user_id", session.user.id);

    if (error) {
      setMessage(error.message);
      setCompleting(false);
      return;
    }

    await supabase.from("xp").insert({
      user_id: session.user.id,
      amount: 10,
      reason: "task_completed",
      task_id: task.id,
    });

    setTasks([]);
    setCompletedTask(task);
    setCompleting(false);
  }
  async function handleSaveReflection() {
    if (!completedTask || !session?.user) return;
    if (!reflectionText.trim()) {
      setMessage("Please write a short reflection.");
      return;
    }

    setReflectionLoading(true);
    setMessage("");

    const { error } = await supabase.from("reflections").insert({
      user_id: session.user.id,
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

  // ── Global Save Handlers for nested layout sub views ───────
  async function saveProfile(data: any) {
    if (!session?.user) return;
    const row = { id: session.user.id, ...data };
    await supabase.from("profiles").upsert(row);
    setProfile(row);
  }

  async function saveGoals(newGoals: any[]) {
    if (!session?.user) return;
    setGoalsState(newGoals);
    const uid = session.user.id;
    for (const g of newGoals) {
      await supabase.from("goals").upsert({ ...g, user_id: uid });
    }
    const ids = newGoals.map((g) => g.id);
    if (ids.length > 0) {
      await supabase.from("goals").delete().eq("user_id", uid).not("id", "in", `(${ids.join(",")})`);
    } else {
      await supabase.from("goals").delete().eq("user_id", uid);
    }
  }

  async function saveToday(data: any) {
    if (!session?.user) return;
    const row = { ...data, user_id: session.user.id, date: TODAY };
    setToday(row);
    await supabase.from("daily_logs").upsert(row, { onConflict: "user_id,date" });
  }

  async function saveChat(messages: any[]) {
    if (!session?.user) return;
    setChat(messages);
    const uid = session.user.id;
    await supabase.from("chat_messages").delete().eq("user_id", uid);
    if (messages.length > 0) {
      await supabase.from("chat_messages").insert(
        messages.map((m) => ({ user_id: uid, role: m.role, content: m.content }))
      );
    }
  }

  // ── Computed Render Variables ──────────────────────────────
  const currentTask = tasks.length > 0 ? tasks[0] : null;
  const currentGoal = currentTask ? goals.find((goal) => goal.id === currentTask.goal_id) : null;

  if (globalLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
        <p style={{ color: "#666" }}>Loading your focus…</p>
      </div>
    );
  }

  if (!session) return <Auth />;

  const isCoach = screen === "coach";
  const componentProps = { profile, goals: goalsState, today, chatHistory: chat, saveGoals, saveToday, saveChat };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: DARK ? "#121212" : "#fff", color: DARK ? "#fff" : "#000" }}>
      {/* App Header */}
      {!isCoach && (
        <div style={{ padding: "14px 1.5rem 12px", borderBottom: "1px solid #e8e5e0", background: DARK ? "#1e1e1e" : "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>Goal Coach</h1>
          {message && <span style={{ fontSize: "0.875rem", color: "#e53e3e" }}>{message}</span>}
        </div>
      )}

      {/* Screen Router Body */}
      <div style={{ flex: 1, padding: "1.5rem" }}>
        {screen === "focus" && (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {currentTask ? (
              <div style={{ padding: "2rem", border: "1px solid #e8e5e0", borderRadius: "8px", background: DARK ? "#1e1e1e" : "#fff" }}>
                {currentGoal && <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "0.5rem" }}>Goal: {currentGoal.title}</p>}
                <h2 style={{ marginTop: 0 }}>{currentTask.title}</h2>
                {currentTask.description && <p style={{ color: "#555" }}>{currentTask.description}</p>}
                <button 
                  disabled={completing} 
                  onClick={() => handleComplete(currentTask)}
                  style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", background: "#4a5568", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  {completing ? "Completing..." : "Mark as Completed (+10 XP)"}
                </button>
              </div>
            ) : completedTask && !reflectionSaved ? (
              <div style={{ padding: "2rem", border: "1px solid #e8e5e0", borderRadius: "8px", background: DARK ? "#1e1e1e" : "#fff" }}>
                <h3>Good Job! Reflect on your task</h3>
                <p>Task: {completedTask.title}</p>
                <textarea 
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="How did it go? What did you learn?"
                  style={{ width: "100%", height: "100px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
                />
                <div style={{ marginTop: "1rem" }}>
                  <input 
                    type="text" 
                    value={reflectionMood} 
                    onChange={(e) => setReflectionMood(e.target.value)} 
                    placeholder="Mood (optional)" 
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", marginRight: "1rem" }}
                  />
                  <button 
                    disabled={reflectionLoading} 
                    onClick={handleSaveReflection}
                    style={{ padding: "0.5rem 1rem", background: "#319795", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    {reflectionLoading ? "Saving..." : "Save Reflection"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <p>All clear! No pending focus tasks available.</p>
              </div>
            )}
          </div>
        )}

        {screen === "goals" && <GoalsScreen {...componentProps} />}
        {screen === "coach" && <CoachScreen {...componentProps} />}
        {screen === "journal" && <JournalScreen {...componentProps} />}
        {screen === "progress" && <ProgressScreen {...componentProps} />}
      </div>

      {/* Persistent Navigation */}
      <NavBar currentScreen={screen} setScreen={setScreen} />
    </div>
  );
}
