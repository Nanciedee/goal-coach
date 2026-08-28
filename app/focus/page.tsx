"use client";

export default function FocusFormView({
  currentTask,
  completedTask,
  reflectionSaved,
  reflectionText,
  setReflectionText,
  handleSaveReflection,
  reflectionLoading,
  handleComplete,
  completing
}) {
  return (
    <div>
      {!currentTask && completedTask && !reflectionSaved ? (
        <div>
          <div style={{ textAlign: "center", padding: "10px 0 20px 0" }}>
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>🎉</div>
            <h2 style={{ marginTop: 0, marginBottom: "8px" }}>You did it!</h2>
            <p style={{ color: "#666", lineHeight: 1.5, margin: 0 }}>
              Take a moment to notice how that went.
            </p>
          </div>

          <div style={{ background: "#f8f7f4", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
            <strong>{completedTask.title}</strong>
          </div>

          <label htmlFor="focusReflection" style={{ display: "block", marginBottom: "8px" }}>
            How did it go?
          </label>

          <textarea
            id="focusReflection"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            style={{
              width: "100%",
              height: "100px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "15px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="button"
            onClick={handleSaveReflection}
            disabled={reflectionLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {reflectionLoading ? "Saving..." : "Save Reflection"}
          </button>
        </div>
      ) : currentTask ? (
        <div>
          <div
            style={{
              background: "#fff",
              border: "2px solid #171717",
              padding: "24px",
              borderRadius: "16px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "20px", marginTop: 0, marginBottom: "8px" }}>
              {currentTask.title}
            </h2>
            {currentTask.description && (
              <p style={{ color: "#555", margin: 0, fontSize: "15px", lineHeight: 1.4 }}>
                {currentTask.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleComplete(currentTask)}
            disabled={completing}
            style={{
              width: "100%",
              padding: "16px",
              background: "#171717",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {completing ? "Completing..." : "Mark as Completed ✓"}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
            All tasks are complete for today! 🎉
          </p>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";
import FocusFormView from "../../components/FocusFormView";

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

export default function FocusPage() {
  const supabase = createClient();

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
    if (!completedTask) {
      return;
    }

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
        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
          <button type="button" onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", padding: 0, color: "#666", cursor: "pointer", fontSize: "14px", marginBottom: "30px", textDecoration: "underline" }}>
            ← Back to Goal Coach
          </button>

          <p style={{ color: "#777", fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>
            ONE-THING FOCUS
          </p>

          <h1 style={{ fontSize: "36px", marginTop: 0, marginBottom: "10px" }}>
            Today's focus
          </h1>

          <p style={{ color: "#666", fontSize: "17px", lineHeight: 1.5 }}>
            You don't need to do everything today.<br />Just focus on one small step.
          </p>

          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "30px 0" }} />

          <FocusFormView 
            currentTask={currentTask} completedTask={completedTask} reflectionSaved={reflectionSaved}
            reflectionText={reflectionText} setReflectionText={setReflectionText} handleSaveReflection={handleSaveReflection}
            reflectionLoading={reflectionLoading} handleComplete={handleComplete} completing={completing}
          />

          {message && (
            <p style={{ color: "red", marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
