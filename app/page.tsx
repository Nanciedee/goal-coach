"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

export default function HomePage() {
  const supabase = createClient();

  const [mode, setMode] = useState<"signup" | "login">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  async function loadGoals(id: string) {
    const { data, error } = await supabase
      .from("goals")
      .select("id, title, description, status")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setGoals(data || []);
  }

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      await loadGoals(user.id);
    }
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Account created! Please check your email to confirm your account."
        );
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        setUserId(data.user.id);
        setMessage("You're signed in! 🎉");
        await loadGoals(data.user.id);
      }
    }

    setLoading(false);
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (!goalTitle.trim()) {
      setMessage("Please enter a goal.");
      return;
    }

    setGoalLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: goalTitle.trim(),
        description: goalDescription.trim() || null,
      })
      .select("id, title, description, status")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setGoals((current) => [data, ...current]);
      setGoalTitle("");
      setGoalDescription("");
      setMessage("Goal saved! 🎯");
    }

    setGoalLoading(false);
  }

  if (userId) {
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
            maxWidth: "650px",
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
            <h1 style={{ fontSize: "40px", margin: 0 }}>Goal Coach</h1>

            <p style={{ color: "#666", fontSize: "18px" }}>
              One thing at a time.
            </p>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "28px 0",
              }}
            />

            <h2>What would you like to work on?</h2>

            <p style={{ color: "#666" }}>
              Start with one goal. You can always add another later.
            </p>

            <form onSubmit={handleCreateGoal}>
              <label
                htmlFor="goalTitle"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  marginTop: "24px",
                }}
              >
                Your goal
              </label>

              <input
                id="goalTitle"
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Example: Walk for 20 minutes each day"
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />

              <label
                htmlFor="goalDescription"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  marginTop: "18px",
                }}
              >
                Why is this important to you? (optional)
              </label>

              <textarea
                id="goalDescription"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={4}
                placeholder="A few words about why you want to do this..."
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />

              <button
                type="submit"
                disabled={goalLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  marginTop: "20px",
                  background: "#171717",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  cursor: goalLoading ? "default" : "pointer",
                }}
              >
                {goalLoading ? "Saving..." : "Save my goal"}
              </button>
            </form>

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

            {goals.length > 0 && (
              <div style={{ marginTop: "35px" }}>
                <h2>Your goals</h2>

                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      padding: "18px",
                      marginTop: "12px",
                      border: "1px solid #eee",
                      borderRadius: "12px",
                    }}
                  >
                    <strong>{goal.title}</strong>

                    {goal.description && (
                      <p style={{ color: "#666", marginBottom: 0 }}>
                        {goal.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f7f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "40px", margin: 0 }}>Goal Coach</h1>

          <p style={{ color: "#666", fontSize: "18px" }}>
            One thing at a time.
          </p>
        </div>

        <h2 style={{ marginBottom: "8px" }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>

        <p style={{ color: "#666", marginBottom: "24px" }}>
          {mode === "signup"
            ? "Let's make progress feel manageable."
            : "Let's keep moving forward."}
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "18px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "13px",
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#171717",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

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

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}
