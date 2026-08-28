"use client";

import { DARK, CORAL } from "./ui";

export default function MainFocusView({
  pendingFocusTask,
  completedTask,
  reflectionSaved,
  reflectionText,
  setReflectionText,
  handleSaveReflection,
  reflectionLoading,
  handleComplete,
  completing,
  FocusScreenComponent
}) {
  return (
    <div>
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

      {!pendingFocusTask && completedTask && !reflectionSaved ? (
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
          <textarea 
            id="focusReflection" 
            value={reflectionText} 
            onChange={(e) => setReflectionText(e.target.value)} 
            style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "15px", boxSizing: "border-box" }} 
          />
          <button 
            onClick={handleSaveReflection} 
            disabled={reflectionLoading} 
            style={{ width: "100%", padding: "12px", background: DARK, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            {reflectionLoading ? "Saving..." : "Save Reflection"}
          </button>
        </div>
      ) : pendingFocusTask ? (
        <div>
          <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>{pendingFocusTask.title}</h3>
          {pendingFocusTask.description && <p style={{ color: "#555", marginBottom: "20px" }}>{pendingFocusTask.description}</p>}
          <button 
            onClick={() => handleComplete(pendingFocusTask)} 
            disabled={completing} 
            style={{ padding: "12px 24px", background: CORAL, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            {completing ? "Completing..." : "Complete Task"}
          </button>
        </div>
      ) : (
        <div style={{ padding: "10px 0" }}>
          {FocusScreenComponent}
        </div>
      )}
    </div>
  );
}
