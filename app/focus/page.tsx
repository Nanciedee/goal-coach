"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

import NavBar from "../../components/NavBar";
import MainFocusView from "../../components/MainFocusView";
import FocusScreen from "../../components/FocusScreen";
import GoalsScreen from "../../components/GoalsScreen";
import CoachScreen from "../../components/CoachScreen";
import JournalScreen from "../../components/JournalScreen";
import ProgressScreen from "../../components/ProgressScreen";

import { DARK } from "../../components/ui";

export default function FocusPage() {
  const supabase = createClient();

  const [currentScreen, setCurrentScreen] = useState<string>("focus");
  const [profile, setProfile] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [completing, setCompleting] = useState(false);

  const [completedTask, setCompletedTask] = useState<any | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionMood, setReflectionMood] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const [todayState, setTodayState] = useState({
    focus_goal_id: "",
    focus_step_override: null,
    energy_level: 3,
    completed: false,
    ai_reframe: ""
  });

  async function loadApplicationData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please sign in first.");
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(profileData || {});

    const { data: goalData, error: goalError } = await supabase.from("goals").select("id, title, description, status").eq("user_id", user.id).order("created_at", { ascending: true });
    if (goalError) { setMessage(goalError.message); setLoading(false); return; }

    const cleanGoals = (goalData || []).map(g => ({ ...g, steps: [], current_step: 0, xp: 0, streak: 0 }));
    setGoals(cleanGoals);

    if (cleanGoals.length > 0) {
      setTodayState(prev => ({ ...prev, focus_goal_id: cleanGoals[0].id }));
    }

    const { data: taskData } = await supabase.from("tasks").select("id, goal_id, title, description, status").eq("user_id", user.id).order("created_at", { ascending: true });
    setTasks(taskData || []);

    const { data: reflectionData } = await supabase.from("reflections").select("id, user_id, task_id, content, mood, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    setReflections(reflectionData || []);

    setLoading(false);
  }

  useEffect(() => { loadApplicationData(); }, []);

  async function handleComplete(task: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCompleting(true);
    await supabase.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", task.id);
    await loadApplicationData();
    setCompletedTask(task);
    setCompleting(false);
  }

  async function handleSaveReflection() {
    if (!completedTask) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !reflectionText.trim()) return;

    setReflectionLoading(true);
    await supabase.from("reflections").insert({ user_id: user.id, task_id: completedTask.id, content: reflectionText.trim(), mood: reflectionMood || null });
    setReflectionText("");
    setReflectionSaved(true);
    await loadApplicationData();
    setReflectionLoading(false);
  }

  const saveToday = async (updatedToday: any) => setTodayState(updatedToday);
  const saveGoals = async (updatedGoals: any) => setGoals(updatedGoals);
  const pendingFocusTask = tasks.find(t => t.status !== "completed") || null;

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
        <p style={{ color: "#666" }}>Loading your dashboard runway...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <button type="button" onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", padding: 0, color: "#666", cursor: "pointer", fontSize: "14px", marginBottom: "25px", textDecoration: "underline" }}>
          ← Back to Goal Coach Hub
        </button>

        <div style={{ background: "white", borderRadius: "16px 16px 0 0", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", borderBottom: "1px solid #eee" }}>
          <NavBar screen={currentScreen} setScreen={setCurrentScreen} />
        </div>

        <div style={{ background: "white", padding: "40px", borderRadius: "0 0 20px 20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          {currentScreen === "focus" && (
            <MainFocusView 
              pendingFocusTask={pendingFocusTask} completedTask={completedTask} reflectionSaved={reflectionSaved}
              reflectionText={reflectionText} setReflectionText={setReflectionText} handleSaveReflection={handleSaveReflection}
              reflectionLoading={reflectionLoading} handleComplete={handleComplete} completing={completing}
              FocusScreenComponent={<FocusScreen profile={profile} goals={goals} today={todayState} saveToday={saveToday} saveGoals={saveGoals} />}
            />
          )}

          {currentScreen === "goals" && <GoalsScreen profile={profile} goals={goals} tasks={tasks} onRefresh={loadApplicationData} />}
          {currentScreen === "coach" && <CoachScreen profile={profile} goals={goals} tasks={tasks} reflections={reflections} />}
          {currentScreen === "journal" && <JournalScreen profile={profile} reflections={reflections} tasks={tasks} />}
          {currentScreen === "progress" && <ProgressScreen profile={profile} goals={goals} tasks={tasks} reflections={reflections} />}

          {message && <p style={{ color: "red", marginTop: "20px" }}>{message}</p>}
        </div>
      </div>
    </main>
  );
}
