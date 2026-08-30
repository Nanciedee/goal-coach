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
  description: string | null;
  status: string;
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

    // Load active goals using your genuine schema columns
    const { data: goalData, error: goalError } = await supabase
  .from("goals")
  .select("id, title, description, status")
  .eq("user_id", user.id)
  .order("created_at", { ascending: true });

    if (goalError) {
      setMessage(goalError.message);
      setLoading(false);
      return;
    }

    setGoals(goalData || []);

    // Load pending one-thing tasks
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
            <FocusScreen initialGoals={goals} onRefreshGoals={loadFocusTask} />
          )}
        </div>
      </div>
    </main>
  );
}
