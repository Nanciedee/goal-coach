"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";

export default function HomePage() {
  const [message, setMessage] = useState("Not connected yet.");
  const [loading, setLoading] = useState(false);

  async function testConnection() {
  setLoading(true);
  setMessage("Checking Supabase...");

  const supabase = createClient();

  const { error } = await supabase.auth.getSession();

  if (error) {
    setMessage(`Connection error: ${error.message}`);
  } else {
    setMessage("Supabase is connected! 🎉");
  }

  setLoading(false);
}

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f7f4",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>
          Goal Coach
        </h1>

        <p style={{ fontSize: "20px", color: "#666", marginBottom: "30px" }}>
          One thing at a time.
        </p>

        <button
          onClick={testConnection}
          disabled={loading}
          style={{
            background: "#171717",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "14px 24px",
            fontSize: "16px",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Test Supabase Connection"}
        </button>

        <p style={{ marginTop: "24px", color: "#555" }}>
          {message}
        </p>
      </div>
    </main>
  );
}
