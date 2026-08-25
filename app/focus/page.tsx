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

export default function FocusPage() {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadFocusTask() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in first.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("id, goal_id, title, description, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadFocusTask();
  }, []);

  async function handleComplete(task: Task) {
    const { error } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, status: "completed" }
          : item
      )
    );

    setMessage("You did it! 🎉");
  }

  const currentTask =
    tasks.find((task) => task.status !== "completed") || null;

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
          <p
            style={{
              color: "#777",
              fontSize: "14px",
              marginBottom: "8px",
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

          {!currentTask ? (
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

              <p style={{ color: "#666" }}>
                There are no unfinished small steps right now.
              </p>
            </div>
          ) : (
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

              {currentTask.description && (
                <p
                  style={{
                    color: "#666",
                    lineHeight: 1.6,
                    marginBottom: "25px",
                  }}
                >
                  {currentTask.description}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleComplete(currentTask)}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "#171717",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "17px",
                  cursor: "pointer",
                }}
              >
                Mark as complete ✓
              </button>
            </div>
          )}

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
        </div>
      </div>
    </main>
  );
}
