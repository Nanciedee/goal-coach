"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

// Import your custom Vite components (Updated paths to match Next.js root)
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

  // ── Your Specific Focus Task Page State ────────────────────
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

  // ── Auth Listener ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    return () => subscription.unsubscribe();
  }, []);

  // ── Load Dashboard Data + Focus Page Tasks ──────────────────
  useEffect(() => {
    if (!session) {
      setGlobalLoading(false);
      setLoading(false);
      return;
    }
    
    // Run both your dashboard data loading and task loading together
    loadAllDashboardData(session.user.id);
    loadFocusTask();
  }, [session]);

  async function loadAllDashboardData(uid: string) {
    setGlobalLoading(true);
    const [{ data: prof }, { data: gls }, { data: log }, { data: msgs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("goals").select("*").eq("user_id", uid).order("created_at"),
      supabase.from("daily_logs").select("*").eq("user_id", uid).eq("date", TODAY).single(),
      supabase.from("chat_messages").select("*").eq("user_id", uid).order("created_at").limit(40),
    ]);

    if (prof) setProfile(prof);
    if (gls) setGoalsState(gls);
    if (log) setToday(log);
    if (msgs) setChat(msgs);
    setGlobalLoading(false);
  }

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
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (goalError) {
      setMessage(goalError.message);
      setLoading(false);
      return;
    }

    setGoals(goalData || []);

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

  // ── Core Task Actions ──────────────────────────────────────
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  // ── Global Save Handlers for other screens ─────────────────
  async function saveProfile(data: any) {
    if (!session) return;
    const row = { id: session.user.id, ...data };
    await supabase.from("profiles").upsert(row);
    setProfile(row);
  }

  async function saveGoals(newGoals: any[]) {
    if (!session) return;
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
    if (!session) return;
    const row = { ...data, user_id: session.user.id, date: TODAY };
    setToday(row);
    await supabase.from("daily_logs").upsert(row, { onConflict: "user_id,date" });
  }

  async function saveChat(messages: any[]) {
    if (!session) return;
    setChat(messages);
    const uid = session.user.id;
    await supabase.from("chat_messages").delete().eq("user_id", uid);
    if (messages.length > 0) {
      await supabase.from("chat_messages").insert(
        messages.map((m) => ({
          user_id: uid,
          role: m.role,
          content: m.content,
        }))
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* App Header */}
      {!isCoach && (
        <div style={{ padding: "14px 1.5rem 12px", borderBottom: "1px solid #e8e5e0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK || "#222", margin: 0 }}>Goal Coach</h1>
            <p style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Make progress one thing at a time.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#888" }}>Hi, {profile?.name || "User"} 👋</span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: "none",
                border: "1px solid #e8e5e0",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                color: "#888",
                padding: "4px 10px",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Screen Router Viewport */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* 'focus' Screen uses your exact visual custom interface markup right here */}
        {screen === "focus" && (
          <main style={{ minHeight: "100vh", background: "#f8f7f4", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
            <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                
                <button
                  type="button"
                  onClick={() => { window.location.href = "/"; }}
                  style={{ background: "none", border: "none", padding: 0, color: "#666", cursor: "pointer", fontSize: "14px", marginBottom: "30px", textDecoration: "underline" }}
                >
                  ← Back to Goal Coach
                </button>

                <p style={{ color: "#777", fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>ONE-THING FOCUS</p>
                <h1 style={{ fontSize: "36px", marginTop: 0, marginBottom: "10px" }}>Today's focus</h1>
                <p style={{ fontSize: "17px", color: "#666", lineHeight: 1.5 }}>
                  You don't need to do everything today.<br />Just focus on one small step.
                </p>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "30px 0" }} />

                {message && <p style={{ color: "red", fontSize: "14px" }}>{message}</p>}

                {/* TASK ACTIVE LAYOUT */}
                {currentTask ? (
                  <div>
                    {currentGoal && (
                      <p style={{ fontSize: "14px", color: "#888", margin: "0 0 5px 0" }}>
                        Goal: <strong>{currentGoal.title}</strong>
                      </p>
                    )}
                    <h2 style={{ marginTop: 0, marginBottom: "10px" }}>{currentTask.title}</h2>
                    {currentTask.description && (
                      <p style={{ color: "#555", marginBottom: "25px", lineHeight: 1.4 }}>{currentTask.description}</p>
                    )}
                    <button
                      onClick={() => handleComplete(currentTask)}
                      disabled={completing}
                      style={{
                        background: "#222", color: "white", border: "none", borderRadius: "10px",
                        padding: "12px 24px", fontSize: "16px", cursor: "pointer", fontWeight: "bold"
                      }}
                    >
                      {completing ? "Completing..." : "Mark as Completed ✔"}
                    </button>
                  </div>
                ) : completedTask && !reflectionSaved ? (
                  /* REFLECTION FORM IF TASK COMPLETED */
                  <div>
                    <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
                      <div style={{ fontSize: "42px", marginBottom: "10px" }}>🎉</div>
                      <h2 style={{ marginTop: 0, marginBottom: "8px" }}>You did it!</h2>
                      <p style={{ color: "#666", lineHeight: 1.5, margin: 0 }}>Take a moment to notice how that went.</p>
                    </div>

                    <div style={{ background: "#f8f7f4", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                      <strong>{completedTask.title}</strong>
                    </div>

                    <label htmlFor="focusReflection" style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                      How did it go?
                    </label>
                    <textarea
                      id="focusReflection"
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="Write down any breakthrough or observation..."
                      style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "15px", fontFamily: "inherit", resize: "vertical" }}
                    />

                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>What was your vibe/mood?</label>
                    <input
                      type="text"
                      value={reflectionMood}
                      onChange={(e) => setReflectionMood(e.target.value)}
                      placeholder="e.g., energized, tired, proud"
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px", fontFamily: "inherit" }}
                    />

                    <button
                      onClick={handleSaveReflection}
                      disabled={reflectionLoading}
                      style={{ background: "#222", color: "white", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "16px", cursor: "pointer", fontWeight: "bold", width: "100%" }}
                    >
                      {reflectionLoading ? "Saving..." : "Save Reflection 💭"}
                    </button>
                  </div>
                ) : (
                  /* NO TASKS LEFT CASE */
                  <div style={{ textAlign: "center", padding: "30px 0" }}>
                    <p style={{ fontSize: "18px", color: "#555" }}>No active focus task right now.</p>
                    <p style={{ color: "#888" }}>Add or activate a task from your Goals tab to get started!</p>
                  </div>
                )}

              </div>
            </div>
          </main>
        )}

        {/* Other dashboard panels load their isolated external UI sub-views */}
        {screen === "goals" && <GoalsScreen {...componentProps} />}
        {screen === "coach" && <CoachScreen {...componentProps} />}
        {screen === "journal" && <JournalScreen {...componentProps} />}
        {screen === "progress" && <ProgressScreen {...componentProps} />}
      </div>

      {/* Persistent Bottom Controls */}
      <NavBar screen={screen} setScreen={setScreen} />
    </div>
  );
}
