"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

type Task = {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  status: string;
};

type Reflection = {
  id: string;
  user_id: string;
  task_id: string | null;
  content: string | null;
  mood: string | null;
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  const [reflectionText, setReflectionText] = useState("");
  const [reflectionMood, setReflectionMood] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionTaskId, setReflectionTaskId] = useState<string | null>(
    null
  );

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

  async function loadTasks(id: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, goal_id, title, description, status")
    .eq("user_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    setMessage(error.message);
    return;
  }

  setTasks(data || []);

  const { data: reflectionData, error: reflectionError } = await supabase
    .from("reflections")
    .select("id, user_id, task_id, content, mood, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (reflectionError) {
    console.error("Error loading reflections:", reflectionError);
    return;
  }

  setReflections(reflectionData || []);
}

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      await loadGoals(user.id);
      await loadTasks(user.id);
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
        await loadTasks(data.user.id);
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

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();

    if (!userId || !selectedGoalId) {
      setMessage("Please choose a goal first.");
      return;
    }

    if (!taskTitle.trim()) {
      setMessage("Please enter a task.");
      return;
    }

    setTaskLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        goal_id: selectedGoalId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
      })
      .select("id, goal_id, title, description, status")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setTasks((current) => [...current, data]);
      setTaskTitle("");
      setTaskDescription("");
      setSelectedGoalId(null);
      setMessage("Small step saved! ✅");
    }

    setTaskLoading(false);
  }

  async function handleToggleTask(task: Task) {
    const newStatus =
      task.status === "completed" ? "pending" : "completed";

    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at:
          newStatus === "completed"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", task.id)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, status: newStatus }
          : item
      )
    );

    setMessage(
      newStatus === "completed"
        ? "Small step completed! 🎉"
        : "Small step marked as incomplete."
    );
  }

  async function handleSaveReflection(task: Task) {
  console.log("🔥 SAVE REFLECTION CLICKED", task);
  console.log("👤 userId:", userId);
  console.log("📝 reflectionText:", reflectionText);
  console.log("🙂 reflectionMood:", reflectionMood);
  console.log("🆔 taskId:", task.id);

  if (!userId) {
    console.log("❌ NO USER ID");
    setMessage("Please sign in first.");
    return;
  }

  if (!reflectionText.trim()) {
    console.log("❌ NO REFLECTION TEXT");
    setMessage("Please write a short reflection.");
    return;
  }

  setReflectionLoading(true);
  setMessage("");

  console.log("🚀 About to call Supabase");

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  console.log("🔐 Auth user:", authData.user?.id);
  console.log("🔐 Auth error:", authError);

  const insertData = {
    user_id: userId,
    task_id: task.id,
    content: reflectionText.trim(),
    mood: reflectionMood || null,
  };

  console.log("📦 Inserting:", insertData);

  const { data, error } = await supabase
    .from("reflections")
    .insert(insertData)
    .select()
    .single();

  console.log("📥 Supabase data:", data);
  console.log("📥 Supabase error:", error);

  if (error) {
    setMessage(`Could not save reflection: ${error.message}`);
    setReflectionLoading(false);
    return;
  }

  console.log("✅ REFLECTION SAVED!");

  setReflectionText("");
  setReflectionMood("");
  setShowReflection(false);
  setReflectionTaskId(null);
  setMessage("Reflection saved! 💭");

  setReflectionLoading(false);
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
            <h1 style={{ fontSize: "40px", margin: 0 }}>
              Goal Coach
            </h1>

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

            {/* TODAY'S FOCUS */}

            <div
              style={{
                background: "#f8f7f4",
                padding: "20px",
                borderRadius: "14px",
                marginBottom: "30px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Today's focus
              </h2>

              {tasks.length === 0 ? (
                <p
                  style={{
                    color: "#666",
                    marginBottom: 0,
                  }}
                >
                  Choose one small step to get started.
                </p>
              ) : (
                (() => {
                  const nextTask =
                    tasks.find(
                      (task) => task.status !== "completed"
                    ) || tasks[0];

                  const taskGoal = goals.find(
                    (goal) => goal.id === nextTask.goal_id
                  );

                  const isCompleted =
                    nextTask.status === "completed";

                  return (
                    <div>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          marginBottom: "8px",
                        }}
                      >
                        {isCompleted ? "☑" : "☐"}{" "}
                        {nextTask.title}
                      </p>

                      {taskGoal && (
                        <p
                          style={{
                            color: "#666",
                            marginTop: 0,
                            marginBottom: "8px",
                          }}
                        >
                          Goal: {taskGoal.title}
                        </p>
                      )}

                      {nextTask.description && (
                        <p
                          style={{
                            color: "#777",
                            marginTop: "8px",
                            marginBottom: 0,
                          }}
                        >
                          {nextTask.description}
                        </p>
                      )}

                      {isCompleted && (
                        <p
                          style={{
                            color: "#555",
                            fontWeight: "bold",
                            marginBottom: 0,
                          }}
                        >
                          You did it! 🎉
                        </p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* CREATE GOAL */}

            <h2>What would you like to work on?</h2>

            <p style={{ color: "#666" }}>
              Start with one goal. You can always add another
              later.
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
                onChange={(e) =>
                  setGoalTitle(e.target.value)
                }
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
                onChange={(e) =>
                  setGoalDescription(e.target.value)
                }
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
                  cursor: goalLoading
                    ? "default"
                    : "pointer",
                }}
              >
                {goalLoading
                  ? "Saving..."
                  : "Save my goal"}
              </button>
            </form>

            {/* MESSAGE */}

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

            {/* YOUR GOALS */}

            {goals.length > 0 && (
              <div style={{ marginTop: "35px" }}>
                <h2>Your goals</h2>

                {goals.map((goal) => {
                  const goalTasks = tasks.filter(
                    (task) => task.goal_id === goal.id
                  );

                  return (
                    <div
                      key={goal.id}
                      style={{
                        padding: "20px",
                        marginTop: "16px",
                        border: "1px solid #eee",
                        borderRadius: "12px",
                      }}
                    >
                      <strong
                        style={{ fontSize: "18px" }}
                      >
                        {goal.title}
                      </strong>

                      {goal.description && (
                        <p style={{ color: "#666" }}>
                          {goal.description}
                        </p>
                      )}

                      {/* PROGRESS */}

                      <div style={{ marginTop: "20px" }}>
                        {(() => {
                          const completedTasks =
                            goalTasks.filter(
                              (task) =>
                                task.status === "completed"
                            ).length;

                          const totalTasks =
                            goalTasks.length;

                          const progress =
                            totalTasks === 0
                              ? 0
                              : Math.round(
                                  (completedTasks /
                                    totalTasks) *
                                    100
                                );

                          return (
                            <div
                              style={{
                                marginBottom: "24px",
                              }}
                            >
                              <h3
                                style={{
                                  marginBottom: "10px",
                                }}
                              >
                                Progress
                              </h3>

                              <p
                                style={{
                                  color: "#666",
                                  marginTop: 0,
                                  marginBottom: "10px",
                                }}
                              >
                                {completedTasks} of{" "}
                                {totalTasks} small{" "}
                                {totalTasks === 1
                                  ? "step"
                                  : "steps"}{" "}
                                completed
                              </p>

                              <div
                                style={{
                                  width: "100%",
                                  height: "10px",
                                  background: "#eee",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    background: "#171717",
                                    borderRadius: "10px",
                                    transition:
                                      "width 0.3s ease",
                                  }}
                                />
                              </div>

                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#777",
                                  marginTop: "8px",
                                }}
                              >
                                {progress}% complete
                              </p>
                            </div>
                          );
                        })()}

                        <h3
                          style={{
                            marginBottom: "10px",
                          }}
                        >
                          Small steps
                        </h3>

                        {/* TASKS */}

                        {goalTasks.length === 0 ? (
                          <p style={{ color: "#888" }}>
                            No small steps yet.
                          </p>
                        ) : (
                          goalTasks.map((task) => (
                            <div
                              key={task.id}
                              style={{
                                padding: "10px 12px",
                                marginTop: "8px",
                                background: "#f8f7f4",
                                borderRadius: "8px",
                              }}
                            >
                              {/* TASK BUTTON */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleTask(task)
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  textAlign: "left",
                                  color:
                                    task.status ===
                                    "completed"
                                      ? "#777"
                                      : "#171717",
                                  textDecoration:
                                    task.status ===
                                    "completed"
                                      ? "line-through"
                                      : "none",
                                }}
                              >
                                {task.status ===
                                "completed"
                                  ? "☑"
                                  : "☐"}{" "}
                                {task.title}
                              </button>

                              {/* TASK DESCRIPTION */}

                              {task.description && (
  <div
    style={{
      color: "#777",
      fontSize: "14px",
      marginTop: "4px",
      marginLeft: "20px",
    }}
  >
    {task.description}
  </div>
)}

{/* SAVED REFLECTIONS */}

{reflections
  .filter(
    (reflection) =>
      reflection.task_id === task.id
  )
  .map((reflection) => (
    <div
      key={reflection.id}
      style={{
        marginTop: "12px",
        marginLeft: "20px",
        padding: "10px",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #eee",
      }}
    >
      <div
  style={{
    fontSize: "13px",
    color: "#888",
    marginBottom: "4px",
  }}
>
  Reflection history
</div>

      <div
        style={{
          fontSize: "14px",
          color: "#444",
        }}
      >
     {reflection.content}
      </div>

      {reflection.mood && (
        <div
          style={{
            fontSize: "13px",
            color: "#777",
            marginTop: "6px",
          }}
        >
          Mood:{" "}
          {reflection.mood === "great"
            ? "Great 😊"
            : reflection.mood === "good"
            ? "Good 🙂"
            : reflection.mood === "okay"
            ? "Okay 😐"
            : reflection.mood === "difficult"
            ? "Difficult 😕"
            : reflection.mood}
        </div>
      )}
    </div>
  ))}

{/* REFLECTION */}

                              {task.status === "completed" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowReflection(
                                        true
                                      );
                                      setReflectionTaskId(
                                        task.id
                                      );
                                      setReflectionText("");
                                      setReflectionMood("");
                                      setMessage("");
                                    }}
                                    style={{
                                      marginTop: "10px",
                                      marginLeft: "20px",
                                      background: "none",
                                      border: "none",
                                      color: "#555",
                                      cursor: "pointer",
                                      textDecoration:
                                        "underline",
                                    }}
                                  >
                                    Reflect on this
                                  </button>

                                  {showReflection &&
                                    reflectionTaskId ===
                                      task.id && (
                                      <div
                                        style={{
                                          marginTop: "15px",
                                          marginLeft: "20px",
                                          padding: "15px",
                                          background:
                                            "white",
                                          borderRadius:
                                            "10px",
                                          border:
                                            "1px solid #ddd",
                                        }}
                                      >
                                        <h4
                                          style={{
                                            marginTop: 0,
                                          }}
                                        >
                                          How did that go?
                                        </h4>

                                        <textarea
                                          value={
                                            reflectionText
                                          }
                                          onChange={(e) =>
                                            setReflectionText(
                                              e.target.value
                                            )
                                          }
                                          rows={3}
                                          placeholder="What did you notice? How did it feel?"
                                          style={{
                                            width: "100%",
                                            padding: "10px",
                                            border:
                                              "1px solid #ddd",
                                            borderRadius:
                                              "8px",
                                            fontSize:
                                              "14px",
                                            boxSizing:
                                              "border-box",
                                            resize:
                                              "vertical",
                                          }}
                                        />

                                        <label
                                          style={{
                                            display: "block",
                                            marginTop: "12px",
                                            marginBottom:
                                              "6px",
                                            fontSize:
                                              "14px",
                                          }}
                                        >
                                          How are you feeling?
                                        </label>

                                        <select
                                          value={
                                            reflectionMood
                                          }
                                          onChange={(e) =>
                                            setReflectionMood(
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "10px",
                                            border:
                                              "1px solid #ddd",
                                            borderRadius:
                                              "8px",
                                            fontSize:
                                              "14px",
                                            background:
                                              "white",
                                          }}
                                        >
                                          <option value="">
                                            Choose one
                                          </option>
                                          <option value="great">
                                            Great 😊
                                          </option>
                                          <option value="good">
                                            Good 🙂
                                          </option>
                                          <option value="okay">
                                            Okay 😐
                                          </option>
                                          <option value="difficult">
                                            Difficult 😕
                                          </option>
                                        </select>

                                        <button
                                          type="button"
                                          disabled={
                                            reflectionLoading
                                          }
                                          onClick={() =>
                                            handleSaveReflection(
                                              task
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "10px",
                                            marginTop:
                                              "12px",
                                            background:
                                              "#171717",
                                            color: "white",
                                            border: "none",
                                            borderRadius:
                                              "8px",
                                            fontSize:
                                              "14px",
                                            cursor:
                                              reflectionLoading
                                                ? "default"
                                                : "pointer",
                                          }}
                                        >
                                          {reflectionLoading
                                            ? "Saving..."
                                            : "Save reflection"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowReflection(
                                              false
                                            );
                                            setReflectionTaskId(
                                              null
                                            );
                                            setReflectionText(
                                              ""
                                            );
                                            setReflectionMood(
                                              ""
                                            );
                                          }}
                                          style={{
                                            width: "100%",
                                            padding: "10px",
                                            marginTop: "8px",
                                            background:
                                              "none",
                                            border: "none",
                                            color: "#666",
                                            cursor: "pointer",
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                </>
                              )}
                            </div>
                          ))
                        )}

                        {/* ADD SMALL STEP BUTTON */}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setMessage("");

                            window.scrollTo({
                              top: document.body
                                .scrollHeight,
                              behavior: "smooth",
                            });
                          }}
                          style={{
                            marginTop: "14px",
                            background: "none",
                            border: "none",
                            color: "#555",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          + Add a small step
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADD A SMALL STEP */}

            {goals.length > 0 && (
              <div
                style={{
                  marginTop: "35px",
                  paddingTop: "25px",
                  borderTop: "1px solid #eee",
                }}
              >
                <h2>Add a small step</h2>

                <p style={{ color: "#666" }}>
                  Break a goal into something small and
                  manageable.
                </p>

                <form onSubmit={handleCreateTask}>
                  <label
                    htmlFor="taskGoal"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      marginTop: "18px",
                    }}
                  >
                    Goal
                  </label>

                  <select
                    id="taskGoal"
                    value={selectedGoalId || ""}
                    onChange={(e) =>
                      setSelectedGoalId(
                        e.target.value || null
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "13px",
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      background: "white",
                    }}
                  >
                    <option value="">
                      Choose a goal
                    </option>

                    {goals.map((goal) => (
                      <option
                        key={goal.id}
                        value={goal.id}
                      >
                        {goal.title}
                      </option>
                    ))}
                  </select>

                  <label
                    htmlFor="taskTitle"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      marginTop: "18px",
                    }}
                  >
                    Small step
                  </label>

                  <input
                    id="taskTitle"
                    type="text"
                    value={taskTitle}
                    onChange={(e) =>
                      setTaskTitle(e.target.value)
                    }
                    placeholder="Example: Put on walking shoes"
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
                    htmlFor="taskDescription"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      marginTop: "18px",
                    }}
                  >
                    Details (optional)
                  </label>

                  <textarea
                    id="taskDescription"
                    value={taskDescription}
                    onChange={(e) =>
                      setTaskDescription(e.target.value)
                    }
                    rows={3}
                    placeholder="Anything that will help you complete it..."
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
                    disabled={taskLoading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      marginTop: "20px",
                      background: "#171717",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "16px",
                      cursor: taskLoading
                        ? "default"
                        : "pointer",
                    }}
                  >
                    {taskLoading
                      ? "Saving..."
                      : "Save small step"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  {/* LOGIN / SIGNUP */}

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
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <h1 style={{ fontSize: "40px", margin: 0 }}>
            Goal Coach
          </h1>

          <p style={{ color: "#666", fontSize: "18px" }}>
            One thing at a time.
          </p>
        </div>

        <h2 style={{ marginBottom: "8px" }}>
          {mode === "signup"
            ? "Create your account"
            : "Welcome back"}
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: "24px",
          }}
        >
          {mode === "signup"
            ? "Let's make progress feel manageable."
            : "Let's keep moving forward."}
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
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
            style={{
              display: "block",
              marginBottom: "8px",
            }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
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
              cursor: loading
                ? "default"
                : "pointer",
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

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode(
                mode === "signup"
                  ? "login"
                  : "signup"
              );
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
