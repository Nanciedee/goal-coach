"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";

export default function HomePage() {
  const supabase = createClient();

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("You're signed in! 🎉");
      }
    }

    setLoading(false);
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
