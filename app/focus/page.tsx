"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase";
import NavBar         from "../../components/NavBar";
import Onboarding     from "../../components/Onboarding";
import FocusScreen    from "../../components/FocusScreen";
import GoalsScreen    from "../../components/GoalsScreen";
import CoachScreen    from "../../components/CoachScreen";
import JournalScreen  from "../../components/JournalScreen";
import ProgressScreen from "../../components/ProgressScreen";

const TODAY = new Date().toDateString();

export default function FocusPage() {
  const supabase = createClient();
  const [screen,  setScreen]  = useState("focus");
  const [profile, setProfile] = useState<any>(null);
  const [goals,   setGoals]   = useState<any[]>([]);
  const [today,   setToday]   = useState<any>({
    date: TODAY, energy_level: 3, focus_goal_id: null,
    focus_step_override: null, completed: false,
    journal_entry: "", mood: null, ai_reframe: null,
  });
  const [chat,    setChat]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }

    const [
      { data: prof },
      { data: gls },
      { data: log },
      { data: msgs },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", TODAY).single(),
      supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at").limit(40),
    ]);

    if (prof)  setProfile(prof);
    if (gls)   setGoals(gls);
    if (log)   setToday(log);
    if (msgs)  setChat(msgs);
    setLoading(false);
  }

  async function saveProfile(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const row = { id: user.id, ...data };
    await supabase.from("profiles").upsert(row);
    setProfile(row);
  }

  async function saveGoals(newGoals: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setGoals(newGoals);
    for (const g of newGoals)
      await supabase.from("goals").upsert({ ...g, user_id: user.id });
    const ids = newGoals.map(g => g.id);
    if (ids.length > 0)
      await supabase.from("goals").delete().eq("user_id", user.id).not("id", "in", `(${ids.join(",")})`);
    else
      await supabase.from("goals").delete().eq("user_id", user.id);
  }

  async function saveToday(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const row = { ...data, user_id: user.id, date: TODAY };
    setToday(row);
    await supabase.from("daily_logs").upsert(row, { onConflict: "user_id,date" });
  }

  async function saveChat(messages: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setChat(messages);
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    if (messages.length > 0)
      await supabase.from("chat_messages").insert(
        messages.map((m: any) => ({ user_id: user.id, role: m.role, content: m.content }))
      );
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
      <p style={{ color: "#666" }}>Loading Goal Coach…</p>
    </main>
  );

  if (!profile) return <Onboarding onComplete={saveProfile} />;

  const isCoach = screen === "coach";
  const props = { profile, goals, today, chatHistory: chat, saveGoals, saveToday, saveChat };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {!isCoach && (
        <div style={{ padding: "14px 1.5rem 12px", borderBottom: "1px solid #e8e5e0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#171717", margin: 0 }}>Goal Coach</h1>
            <p style={{ fontSize: "11px", color: "#aaa", marginTop: 1, marginBottom: 0 }}>Make progress one thing at a time.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "13px", color: "#888" }}>Hi, {profile.name} 👋</span>
            <button onClick={() => supabase.auth.signOut().then(() => { window.location.href = "/"; })}
              style={{ background: "none", border: "1px solid #e8e5e0", borderRadius: 8, cursor: "pointer", fontSize: "12px", color: "#888", padding: "4px 10px" }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {screen === "focus"    && <FocusScreen    {...props} />}
        {screen === "goals"    && <GoalsScreen    {...props} />}
        {screen === "coach"    && <CoachScreen    {...props} />}
        {screen === "journal"  && <JournalScreen  {...props} />}
        {screen === "progress" && <ProgressScreen {...props} />}
      </div>

      <NavBar screen={screen} setScreen={setScreen} />
    </div>
  );
}
