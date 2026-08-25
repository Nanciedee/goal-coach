"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

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

    setTasks([]);
    setCompletedTask(task);
    setMessage("Bravo! 🎉");
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

  const currentGoal = currentTask
    ? goals.find((goal) => goal.id === currentTask.goal_id)
    : null;

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8f7f4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p style={{ color: "#666" }}>Loading your focus...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f7f4",
        padding: "40px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          {/* BACK TO GOALS */}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#666",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "30px",
              textDecoration: "underline",
            }}
          >
            ← Back to Goal Coach
          </button>

          {/* HEADER */}

          <p
            style={{
              color: "#777",
              fontSize: "14px",
              marginBottom: "8px",
              letterSpacing: "0.5px",
            }}
          >
            ONE-THING FOCUS
          </p>

          <h1
            style={{
              fontSize: "36px",
              marginTop: 0,
              marginBottom: "10px",
            }}
          >
            Today's focus
          </h1>

          <p
            style={{
              color: "#666",
              fontSize: "17px",
              lineHeight: 1.5,
            }}
          >
            You don't need to do everything today.
            <br />
            Just focus on one small step.
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "30px 0",
            }}
          />

          {/* AFTER COMPLETING A TASK */}

          {!currentTask && completedTask && !reflectionSaved ? (
            <div>
              <div
                style={{
                  textAlign: "center",
                  padding: "10px 0 20px 0",
                }}
              >
                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "10px",
                  }}
                >
                  🎉
                </div>

                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "8px",
                  }}
                >
                  You did it!
                </h2>

                <p
                  style={{
                    color: "#666",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Take a moment to notice how that went.
                </p>
              </div>

              <div
                style={{
                  background: "#f8f7f4",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                }}
              >
                <strong>{completedTask.title}</strong>
              </div>

              <label
                htmlFor="focusReflection"
                style={{
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                How did it go?
              </label>

              <textarea
                id="focusReflection"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                rows={4}
                placeholder="What did you notice? How did it feel?"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />

              <label
                htmlFor="focusMood"
                style={{
                  display: "block",
                  marginTop: "15px",
                  marginBottom: "8px",
                }}
              >
                How are you feeling?
              </label>

              <select
                id="focusMood"
                value={reflectionMood}
                onChange={(e) => setReflectionMood(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "15px",
                  background: "white",
                }}
              >
                <option value="">Choose one</option>
                <option value="great">Great 😊</option>
                <option value="good">Good 🙂</option>
                <option value="okay">Okay 😐</option>
                <option value="difficult">Difficult 😕</option>
              </select>

              <button
                type="button"
                disabled={reflectionLoading}
                onClick={handleSaveReflection}
                style={{
                  width: "100%",
                  padding: "14px",
                  marginTop: "18px",
                  background: "#171717",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  cursor: reflectionLoading ? "default" : "pointer",
                }}
              >
                {reflectionLoading
                  ? "Saving..."
                  : "Save reflection"}
              </button>

              {message && (
                <p
                  style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#f4f4f4",
                    borderRadius: "10px",
                    color: "#444",
                    textAlign: "center",
                  }}
                >
                  {message}
                </p>
              )}
            </div>
          ) : !currentTask ? (
            /* NO TASKS */

            <div
              style={{
                textAlign: "center",
                padding: "30px 10px",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "15px",
                }}
              >
                🎉
              </div>

              <h2>You're all caught up!</h2>

              <p
                style={{
                  color: "#666",
                  lineHeight: 1.5,
                }}
              >
                You don't have any unfinished small steps right now.
              </p>

              {message && (
                <p
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    background: "#f4f4f4",
                    borderRadius: "10px",
                    color: "#444",
                  }}
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  marginTop: "20px",
                  background: "#171717",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Back to Goal Coach
              </button>
            </div>
          ) : (
            /* CURRENT TASK */

            <div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#888",
                  marginBottom: "8px",
                }}
              >
                Your one thing
              </p>

              <h2
                style={{
                  fontSize: "28px",
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                {currentTask.title}
              </h2>

              {currentGoal && (
                <p
                  style={{
                    color: "#777",
                    fontSize: "14px",
                    marginBottom: "18px",
                  }}
                >
                  Goal: {currentGoal.title}
                </p>
              )}

              {currentTask.description && (
                <div
                  style={{
                    background: "#f8f7f4",
                    padding: "18px",
                    borderRadius: "12px",
                    marginBottom: "25px",
                  }}
                >
                  <p
                    style={{
                      color: "#666",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {currentTask.description}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={completing}
                onClick={() => handleComplete(currentTask)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: completing ? "#555" : "#171717",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "17px",
                  cursor: completing ? "default" : "pointer",
                }}
              >
                {completing ? "Saving..." : "I'm done ✓"}
              </button>

              {message && (
                <p
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    background: "#f4f4f4",
                    borderRadius: "10px",
                    color: "#444",
                    textAlign: "center",
                  }}
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "12px",
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Back to my goals
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
