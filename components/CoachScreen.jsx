"use client"; 

import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  beige: "#f8f7f4", dark: "#171717", blue: "#185FA5", blueLight: "#EBF4FF",
  coral: "#D85A30", sage: "#4a7c5a", sageBg: "#f0f5f0", sageDark: "#2a4a2e",
  sageMid: "#6a946e", sageBorder: "#dde8dd", white: "#ffffff",
  border: "#e8e5df", muted: "#888888", light: "#fafaf8",
};

// ═══════════════════════════════════════════════════════════════════════════════
// CBT SAFETY GUARDRAILS — strict, always-first checks
// ═══════════════════════════════════════════════════════════════════════════════
const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|end my life|don't want to live|want to die|dying inside|wanna die)\b/i,
  /\b(self.harm|cutting myself|hurt myself|hurting myself|harm myself)\b/i,
  /\b(no point in living|can't go on|give up on life|not worth living|life isn't worth)\b/i,
  /\b(overdose|take all my pills|disappear forever|everyone would be better without me)\b/i,
];

const PROFESSIONAL_PATTERNS = [
  /\b(diagnosed with|my therapist|my psychiatrist|my medication|clinical depression|bipolar|schizophrenia|PTSD)\b/i,
  /\b(abuse|assault|sexual abuse|domestic violence|addiction|relapse|recovering addict)\b/i,
  /\b(panic disorder|eating disorder|anorexia|bulimia|OCD|borderline)\b/i,
];

const CRISIS_RESPONSE =
  `I hear you — and I want you to know I'm taking what you've shared seriously. 🌿\n\nWhat you're feeling right now is real, and you deserve real support. Please reach out right now:\n\n📞 988 Suicide & Crisis Lifeline — call or text 988 (US, 24/7)\n💬 Crisis Text Line — text HOME to 741741\n🌐 International help — findahelpline.com\n\nI'm a coaching tool, not a therapist. For what you're carrying right now, a trained counselor can give you care I can't. Please reach out to one of the above — you matter, and you don't have to face this alone.`;

const PROFESSIONAL_RESPONSE =
  `Thank you for trusting me with something so personal. 🌿\n\nWhat you're describing sounds like it deserves the care of a trained professional — a therapist or counselor who can work with you properly, not just a coaching app.\n\nI can help with everyday goals and mental blocks, but for this, please consider speaking with someone qualified. Would it help to talk about how to find a therapist, or is there something lighter I can help you focus on today?`;

// ═══════════════════════════════════════════════════════════════════════════════
// CBT DISTORTION & EMOTION RESPONSE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
const DISTORTIONS = {
  catastrophizing: {
    pattern: /\b(always ruins|never works|worst ever|total disaster|everything is ruined|it's all over|nothing ever goes right)\b/i,
    responses: [
      "That sounds heavy. When our minds jump to 'always' and 'never,' they're often amplifying. What's the most *likely* outcome here — not the worst, not the best?",
      "Big words like 'disaster' or 'ruined' can feel very real. What would a neutral observer actually see if they watched this situation?",
      "I hear a lot of permanence in what you're saying. Is this as fixed as it feels — or could things look different in a week?",
    ],
  },
  allOrNothing: {
    pattern: /\b(complete failure|total failure|i'm worthless|i'm useless|perfect or nothing|either i do it perfectly|i failed completely)\b/i,
    responses: [
      "That sounds like all-or-nothing thinking — one of the most common thinking traps. Where on the spectrum between 'total failure' and 'perfect' does this actually land?",
      "That's a very harsh label to put on yourself. What would you say to a close friend who described themselves that way?",
      "When we're in this headspace, it's hard to see the middle ground. What's one thing — even tiny — that went okay?",
    ],
  },
  mindReading: {
    pattern: /\b(they think i'm|everyone thinks|they hate me|nobody cares about me|they're judging me|they must think)\b/i,
    responses: [
      "It sounds like you're reading their minds. That's one of the sneakiest thinking patterns — we rarely know what others are actually thinking. What's the *evidence* for that thought?",
      "What are two other possible explanations for how they're behaving — even if they feel less likely?",
    ],
  },
  overgeneralization: {
    pattern: /\b(nothing ever works for me|i always mess up|i can never|i'll never be able to|it always happens to me)\b/i,
    responses: [
      "Stressed brains love to generalize. Has there been even *one* time this worked — even partially?",
      "That's a heavy pattern to carry. Can we zoom in on just *this* situation, separate from the whole story?",
    ],
  },
  shouldStatements: {
    pattern: /\b(i should be|i must be|i have to be|i'm supposed to|i ought to have)\b/i,
    responses: [
      "Those 'should' statements carry a lot of weight. Who decided this rule — and is it actually yours?",
      "What would change if you swapped 'I should' for 'I'd like to'? Does that shift anything?",
    ],
  },
  personalization: {
    pattern: /\b(it's all my fault|i caused this|because of me|i ruined it|i'm the reason)\b/i,
    responses: [
      "You're taking on a lot of responsibility there. How much of this was actually in your control?",
      "What other factors played a role here — things that had nothing to do with you?",
    ],
  },
};

const EMOTION_GROUPS = {
  overwhelmed: {
    pattern: /\b(overwhelmed|too much|can't handle|drowning in|buried under|so much to do)\b/i,
    responses: [
      "Overwhelm almost always means we're thinking too many steps ahead at once. What's the one *smallest* thing that would feel like a real win in the next 30 minutes?",
      "Let's put down 80% of it for a second. If you could only do one thing today, what would it be?",
      "I hear that. 🌿 Overwhelm is a signal, not a verdict. What's the most urgent *one* thing — not the whole list?",
    ],
  },
  stressed: {
    pattern: /\b(stressed|anxious|pressure|worried|scared|nervous|on edge)\b/i,
    responses: [
      "Stress usually has a specific source. What feels most urgent or threatening right now?",
      "Let's name it — sometimes putting it into words takes some of the charge out of it. What's the core of what's stressing you?",
      "Stress often comes from a gap between where we are and where we think we should be. Which part of that gap feels biggest today?",
    ],
  },
  sad: {
    pattern: /\b(sad|unhappy|down|grief|lost|lonely|empty|hopeless feeling)\b/i,
    responses: [
      "I'm glad you shared that. Sadness is asking to be acknowledged, not fixed. What's underneath it — do you have a sense?",
      "Sometimes sadness is completely appropriate to what's happening. What would feel like the kindest thing to do for yourself right now?",
    ],
  },
  motivated: {
    pattern: /\b(motivated|excited|ready|pumped|energized|feeling great|on fire)\b/i,
    responses: [
      "That energy is real — let's aim it well. What's the highest-leverage thing you could do in the next hour?",
      "I love that. Ride that wave — what's your focus right now?",
      "Brilliant. This is the moment to tackle the hard thing. What would make today a real win?",
    ],
  },
  stuck: {
    pattern: /\b(stuck|blocked|don't know where to start|not sure how|can't start|paralyzed|procrastinat)\b/i,
    responses: [
      "Being stuck usually points to one of three things: the task is unclear, it feels too big, or there's a hidden fear. Which feels closest?",
      "What would the *tiniest* possible first move look like — something so small it almost feels silly?",
      "Sometimes stuck means we need more information. What would you need to know to feel like you could take one step forward?",
    ],
  },
  tired: {
    pattern: /\b(tired|exhausted|drained|burned out|no energy|worn out|depleted)\b/i,
    responses: [
      "Rest isn't a reward — it's part of the work. Is what you're tired from physical, mental, or emotional?",
      "Low energy days are real. What's the *lightest* version of progress that would still feel like a win today?",
    ],
  },
  angry: {
    pattern: /\b(angry|frustrated|furious|mad|annoyed|irritated|resentful)\b/i,
    responses: [
      "Anger is usually a secondary emotion — something else is underneath it. What's the hurt or fear that's fueling this?",
      "That sounds really frustrating. What would you most need right now — to be heard, to solve it, or to let it go?",
    ],
  },
};

const NEUTRAL_RESPONSES = [
  "Tell me more — what's really going on underneath that?",
  "That's worth sitting with. What feels most true about it for you?",
  "I'm listening. What would be most helpful to explore here?",
  "And what does your gut tell you about this?",
  "What would it mean for you if that were true?",
  "What's the version of this story where you have some power to change something?",
  "What would you tell a close friend who came to you with this exact situation?",
  "What's one thing you haven't tried yet?",
];

function getOsirisResponse(input, userName, goalText) {
  // 1 — CRISIS CHECK (always first, non-negotiable)
  for (const p of CRISIS_PATTERNS) {
    if (p.test(input)) return CRISIS_RESPONSE;
  }
  // 2 — PROFESSIONAL REFERRAL CHECK
  for (const p of PROFESSIONAL_PATTERNS) {
    if (p.test(input)) return PROFESSIONAL_RESPONSE;
  }
  // 3 — COGNITIVE DISTORTION DETECTION
  for (const [, { pattern, responses }] of Object.entries(DISTORTIONS)) {
    if (pattern.test(input)) return responses[Math.floor(Math.random() * responses.length)];
  }
  // 4 — EMOTION DETECTION
  for (const [, { pattern, responses }] of Object.entries(EMOTION_GROUPS)) {
    if (pattern.test(input)) return responses[Math.floor(Math.random() * responses.length)];
  }
  // 5 — GOAL CONTEXT
  if (/goal|step|progress|plan|next step/i.test(input) && goalText) {
    return `With "${goalText}" as your focus — what's the one part of it that feels most within reach right now?`;
  }
  // 6 — SOCRATIC NEUTRAL
  return NEUTRAL_RESPONSES[Math.floor(Math.random() * NEUTRAL_RESPONSES.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK GOAL STEP GENERATOR (no API needed)
// ═══════════════════════════════════════════════════════════════════════════════
const STEP_TEMPLATES = {
  fitness: [
    { title: "Set your honest baseline", description: "Write down exactly where you are now — weight, resting heart rate, what you can currently do. No judgement, just data.", estimatedMinutes: 20 },
    { title: "Define a measurable target", description: "Turn 'get fit' into a specific number with a date: '30-minute run without stopping by Oct 31.'", estimatedMinutes: 15 },
    { title: "Choose ONE program and commit", description: "Research 2–3 options and pick just one. Starting beats optimizing.", estimatedMinutes: 30 },
    { title: "Remove the friction", description: "Set out your gear tonight, clear a workout space, and put your shoes by the door.", estimatedMinutes: 20 },
    { title: "Block 4 sessions in your calendar", description: "Treat them like appointments. Same time each day builds the habit faster.", estimatedMinutes: 15 },
    { title: "Complete session 1", description: "Do it. Imperfect is fine — done is the only thing that counts here.", estimatedMinutes: 45 },
    { title: "Find one accountability partner", description: "Tell one person your goal. Ask them to check in with you every Sunday.", estimatedMinutes: 15 },
    { title: "Review after 3 sessions", description: "What's working? What needs adjusting? Don't wait a month to course-correct.", estimatedMinutes: 20 },
    { title: "Build your recovery routine", description: "Plan sleep, stretching, and nutrition around your sessions — not as an afterthought.", estimatedMinutes: 25 },
  ],
  business: [
    { title: "Write your one-sentence offer", description: "Who do you serve, what do you help them do, and what's the result? One sentence only.", estimatedMinutes: 30 },
    { title: "List your first 5 prospects", description: "Name 5 real people or businesses who could genuinely benefit from what you offer right now.", estimatedMinutes: 20 },
    { title: "Research 3 competitors", description: "Note what they charge, how they position, and — most importantly — what they're missing.", estimatedMinutes: 35 },
    { title: "Build a minimal portfolio", description: "Create 2–3 samples of your work. Real is better, but concept pieces work if you're just starting.", estimatedMinutes: 45 },
    { title: "Set your price", description: "Research market rates, then set a number you can say out loud without flinching.", estimatedMinutes: 20 },
    { title: "Write a personal outreach message", description: "Draft a short, genuine message to send to your first 3 prospects. No templates — be human.", estimatedMinutes: 25 },
    { title: "Send your first outreach", description: "Send to at least 3 people today. Done beats perfect. Every time.", estimatedMinutes: 20 },
    { title: "Follow up (once)", description: "Anyone who didn't respond after 5 days gets one polite follow-up. Then move on.", estimatedMinutes: 15 },
    { title: "Run your first discovery call", description: "Have a real conversation with an interested prospect. Listen 70%, talk 30%.", estimatedMinutes: 30 },
  ],
  learning: [
    { title: "Define the exact outcome", description: "Not 'learn Python' — 'build a working personal expense tracker in 60 days.'", estimatedMinutes: 20 },
    { title: "Choose ONE resource and commit", description: "Pick a single course, book, or program. Finish it before starting another.", estimatedMinutes: 25 },
    { title: "Block a daily practice window", description: "20–30 minutes, same time every day. Consistency beats intensity.", estimatedMinutes: 15 },
    { title: "Complete session 1 today", description: "Don't wait for the right time. Start now and take brief notes on what surprised you.", estimatedMinutes: 30 },
    { title: "Teach it to someone", description: "Explain the first concept to someone else — even a child. If you can't, you haven't learned it yet.", estimatedMinutes: 20 },
    { title: "Find a practice partner or community", description: "Connect with one person on the same path. Accountability and practice in one.", estimatedMinutes: 20 },
    { title: "Complete your first milestone", description: "Finish the first chapter, unit, or module. Celebrate it — it's real progress.", estimatedMinutes: 40 },
    { title: "Isolate your sticking point", description: "What's the hardest concept so far? Spend focused time just on that one thing.", estimatedMinutes: 35 },
    { title: "Apply it in a real context", description: "Use your new skill in a real situation — imperfectly. That's where learning actually sticks.", estimatedMinutes: 30 },
  ],
  writing: [
    { title: "Define audience and purpose", description: "Who reads this, and what do you want them to think, feel, or do after reading?", estimatedMinutes: 20 },
    { title: "Write a rough outline", description: "Bullet points only. 5–7 main ideas, ordered logically. Don't write yet — just map.", estimatedMinutes: 25 },
    { title: "Write a messy first draft", description: "No editing allowed. Get it all out. Quantity, not quality. You can't edit a blank page.", estimatedMinutes: 45 },
    { title: "Step away for 24 hours", description: "Don't touch it. Let your brain reset. This step is non-negotiable.", estimatedMinutes: 10 },
    { title: "Cut your first paragraph", description: "Most writing buries the real opening. Where does it actually start? Delete everything before that.", estimatedMinutes: 20 },
    { title: "Read it aloud", description: "Your ears catch what your eyes miss. Read every sentence out loud — all of it.", estimatedMinutes: 20 },
    { title: "Get one piece of feedback", description: "Ask one trusted person what confused them. Just that one question.", estimatedMinutes: 25 },
    { title: "Final edit", description: "Fix grammar, tighten sentences, cut filler words: 'very,' 'really,' 'just,' 'that.' Cut 10% by default.", estimatedMinutes: 30 },
    { title: "Publish or submit", description: "Done is better than perfect. Hit send, post it, or submit. You can always revise the next version.", estimatedMinutes: 15 },
  ],
  default: [
    { title: "Define exactly what success looks like", description: "Write it down: what specifically will be different when this goal is complete? Be precise.", estimatedMinutes: 20 },
    { title: "Identify your biggest obstacle", description: "What's the one thing most likely to stop you? Write it down — then plan around it.", estimatedMinutes: 20 },
    { title: "Find 2 people who've done this", description: "How did they approach it? What would they do differently? Borrow their lessons.", estimatedMinutes: 30 },
    { title: "Build a rough 30-day map", description: "What does consistent progress look like over 30 days? Rough outline — not a rigid plan.", estimatedMinutes: 25 },
    { title: "Take your first action today", description: "Not tomorrow. The smallest possible first move, right now. Momentum starts here.", estimatedMinutes: 30 },
    { title: "Set up your environment", description: "Arrange your tools, space, and calendar so starting requires zero effort.", estimatedMinutes: 20 },
    { title: "Build your accountability system", description: "Weekly check-in with yourself (or someone else). What's working? What's not?", estimatedMinutes: 15 },
    { title: "Handle the resistance", description: "When the wall hits — and it will — name what's stopping you and take the smallest action.", estimatedMinutes: 25 },
    { title: "Celebrate and reset", description: "Acknowledge what you've done. Then set the next milestone. Progress compounds.", estimatedMinutes: 15 },
  ],
};

function generateSteps(goalText) {
  let tpl;
  if (/fitness|workout|exercise|weight loss|run|gym|health|physic|diet|nutrition/i.test(goalText)) tpl = STEP_TEMPLATES.fitness;
  else if (/business|freelanc|client|income|revenue|entrepreneur|startup|brand|launch/i.test(goalText)) tpl = STEP_TEMPLATES.business;
  else if (/learn|study|course|skill|language|code|programming|degree|certif|master/i.test(goalText)) tpl = STEP_TEMPLATES.learning;
  else if (/write|book|blog|article|essay|content|publish|novel|script|story/i.test(goalText)) tpl = STEP_TEMPLATES.writing;
  else tpl = STEP_TEMPLATES.default;
  return tpl.map((s, i) => ({ ...s, step: i + 1 }));
}

function pickStep(steps, completedSteps, energy) {
  const remaining = steps.filter(s => !completedSteps.includes(s.step));
  if (!remaining.length) return null;
  const sorted = [...remaining].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
  let picked, reason;
  if (energy <= 2) {
    picked = sorted[0];
    const reasons = ["Low energy today — this gentle step keeps your streak alive without burning you out.", "Small wins on low-energy days add up. This step is exactly the right size for right now. 🌱"];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
  } else if (energy >= 4) {
    picked = sorted[sorted.length - 1];
    const reasons = ["Your energy is high — this is the moment to tackle the most demanding step.", "High energy is a resource. Let's spend it on the step that will move the needle most. 🚀"];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
  } else {
    picked = remaining[Math.floor(remaining.length / 2)] || remaining[0];
    const reasons = ["Medium energy calls for a medium step — steady and focused.", "A solid match for today's pace. Not too light, not too heavy."];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
  }
  return { step: picked, reason };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING DATA
// ═══════════════════════════════════════════════════════════════════════════════
const ONBOARD_QS = [
  { key: "style", q: "How do you work best?", opts: ["I plan everything ahead", "I stay flexible and adapt", "I need someone to hold me accountable", "Quick wins keep me going"] },
  { key: "block", q: "What's your biggest block to reaching goals?", opts: ["I start strong but lose momentum", "I get overwhelmed and don't know where to start", "Life gets busy and I forget", "I'm too hard on myself when I slip"] },
  { key: "peak", q: "When is your energy highest?", opts: ["Early morning", "Mid-morning", "Afternoon", "Evening"] },
  { key: "motive", q: "What motivates you most?", opts: ["Seeing visible progress", "Helping others and my family", "Personal growth and learning", "Recognition and rewards"] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function GoalCoach() {
  const [view, setView] = useState("loading");
  const [loginTab, setLoginTab] = useState("signin");
  const [user, setUser] = useState(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState("");

  const [obStep, setObStep] = useState(0);
  const [obAnswers, setObAnswers] = useState({});

  const [goals, setGoals] = useState([]);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [focusTask, setFocusTask] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [recalNote, setRecalNote] = useState("");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [newGoalText, setNewGoalText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  const [jMood, setJMood] = useState("");
  const [jText, setJText] = useState("");
  const [jMedia, setJMedia] = useState([]);
  const [jSaved, setJSaved] = useState(false);
  const fileRef = useRef(null);

  const [toast, setToast] = useState("");

  const activeGoal = goals.find(g => g.id === activeGoalId) || null;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // ── Session load
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("gc:session");
        if (r?.value) {
          const s = JSON.parse(r.value);
          if (s.user) {
            setUser(s.user); setGoals(s.goals || []);
            setActiveGoalId(s.activeGoalId || null); setFocusTask(s.focusTask || null);
            setXp(s.xp || 0); setStreak(s.streak || 0);
            setChatHistory(s.chatHistory || []);
            setView("home"); return;
          }
        }
      } catch (_) {}
      setView("login");
    })();
  }, []);

  // ── Auto-persist
  useEffect(() => {
    if (!user || view === "loading") return;
    (async () => {
      try {
        await window.storage.set("gc:session", JSON.stringify({
          user, goals, activeGoalId, focusTask, xp, streak,
          chatHistory: chatHistory.slice(-40),
        }));
      } catch (_) {}
    })();
  }, [user, goals, activeGoalId, focusTask, xp, streak, chatHistory]);

  // ── Scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory, chatLoading]);

  // ══ AUTH ══════════════════════════════════════════════════════════════════
  async function doLogin() {
    setAuthErr("");
    if (!authEmail || !authPass) { setAuthErr("Please fill in all fields."); return; }
    try {
      const r = await window.storage.get(`gc:u:${authEmail}`);
      if (!r?.value) { setAuthErr("No account found with that email."); return; }
      const u = JSON.parse(r.value);
      if (u.password !== authPass) { setAuthErr("Incorrect password."); return; }
      setUser(u);
      try {
        const d = await window.storage.get(`gc:d:${authEmail}`);
        if (d?.value) {
          const data = JSON.parse(d.value);
          setGoals(data.goals || []); setActiveGoalId(data.activeGoalId || null);
          setFocusTask(data.focusTask || null); setXp(data.xp || 0);
          setStreak(data.streak || 0); setChatHistory(data.chatHistory || []);
        }
      } catch (_) {}
      setView(u.onboarded ? "home" : "onboard");
    } catch (_) { setAuthErr("Login failed — please try again."); }
  }

  async function doSignup() {
    setAuthErr("");
    if (!authName || !authEmail || !authPass) { setAuthErr("Please fill in all fields."); return; }
    if (authPass.length < 6) { setAuthErr("Password must be at least 6 characters."); return; }
    try {
      const existing = await window.storage.get(`gc:u:${authEmail}`).catch(() => null);
      if (existing?.value) { setAuthErr("An account already exists with that email."); return; }
    } catch (_) {}
    const newUser = { name: authName, email: authEmail, password: authPass, onboarded: false, profile: {}, createdAt: Date.now() };
    try { await window.storage.set(`gc:u:${authEmail}`, JSON.stringify(newUser)); }
    catch (_) { setAuthErr("Signup failed — please try again."); return; }
    setUser(newUser);
    setGoals([]); setActiveGoalId(null); setFocusTask(null);
    setXp(0); setStreak(0); setChatHistory([]);
    setView("onboard");
  }

  function doSignOut() {
    setUser(null); setGoals([]); setActiveGoalId(null);
    setFocusTask(null); setXp(0); setStreak(0); setChatHistory([]);
    setView("login");
    setAuthEmail(""); setAuthPass(""); setAuthName(""); setAuthErr("");
  }

  // ══ ONBOARDING ════════════════════════════════════════════════════════════
  async function finishOnboard() {
    const updated = { ...user, onboarded: true, profile: obAnswers };
    try { await window.storage.set(`gc:u:${user.email}`, JSON.stringify(updated)); } catch (_) {}
    setUser(updated);
    const first = updated.name.split(" ")[0];
    setChatHistory([{
      role: "osiris",
      content: `Welcome, ${first}. I'm Osiris — your personal coach. ✦\n\nI've noted how you work best, and I'm here whenever you need to think through a goal, work through a block, or just check in. There's no judgement here — only forward movement.\n\nWhat would you like to work on first?`,
    }]);
    setView("home");
  }

  // ══ GOALS ═════════════════════════════════════════════════════════════════
  async function addGoal() {
    if (!newGoalText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiMsg("Building your step-by-step plan…");
    await new Promise(r => setTimeout(r, 1200));
    const steps = generateSteps(newGoalText);
    const goal = { id: Date.now(), text: newGoalText.trim(), steps, completedSteps: [], createdAt: Date.now() };
    setGoals(g => [...g, goal]);
    setActiveGoalId(goal.id);
    setFocusTask(steps[0] || null);
    setRecalNote(""); setNewGoalText("");
    setAiLoading(false); setAiMsg("");
    setView("home");
    showToast("Goal added — your plan is ready! 🎯");
  }

  async function handleRecalibrate() {
    if (!activeGoal || aiLoading) return;
    setAiLoading(true); setAiMsg("Finding the right step for your energy…");
    await new Promise(r => setTimeout(r, 900));
    const result = pickStep(activeGoal.steps, activeGoal.completedSteps, energy);
    if (result) { setFocusTask(result.step); setRecalNote(result.reason); }
    else showToast("All steps complete! 🎉");
    setAiLoading(false); setAiMsg("");
  }

  function completeTask() {
    if (!activeGoal || !focusTask) return;
    const updatedGoals = goals.map(g =>
      g.id === activeGoalId ? { ...g, completedSteps: [...g.completedSteps, focusTask.step] } : g
    );
    setGoals(updatedGoals);
    setXp(p => p + 50); setStreak(p => p + 1); setRecalNote("");
    const updated = updatedGoals.find(g => g.id === activeGoalId);
    const next = updated?.steps.find(s => !updated.completedSteps.includes(s.step));
    setFocusTask(next || null);
    showToast(next ? "+50 XP — keep going! ⚡" : "Goal complete! 🎉 +50 XP");
  }

  // ══ OSIRIS CHAT ═══════════════════════════════════════════════════════════
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = { role: "user", content: chatInput.trim() };
    setChatHistory(h => [...h, msg]);
    setChatInput("");
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 500 + Math.random() * 900));
    const reply = getOsirisResponse(msg.content, user?.name, activeGoal?.text);
    setChatHistory(h => [...h, { role: "osiris", content: reply }]);
    setChatLoading(false);
  }

  function startVoice(setter) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input works in Chrome and Safari — please use one of those browsers."); return; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false;
    r.onresult = e => setter(p => (p ? p + " " : "") + e.results[0][0].transcript);
    r.onerror = () => alert("Microphone access is needed. Please allow it in your browser settings.");
    r.start();
  }

  // ══ JOURNAL ═══════════════════════════════════════════════════════════════
  function handleMedia(e) {
    Array.from(e.target.files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { alert(`"${file.name}" is over 5 MB. Please use a smaller file.`); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "audio";
        setJMedia(p => [...p, { type, name: file.name, data: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function saveJournal() {
    const entry = {
      date: new Date().toDateString(), mood: jMood, text: jText,
      mediaCount: jMedia.length, xp, streak,
      task: focusTask?.title || null, goal: activeGoal?.text || null,
      savedAt: Date.now(),
    };
    try {
      const ex = await window.storage.get(`gc:j:${user.email}`).catch(() => null);
      const entries = ex?.value ? JSON.parse(ex.value) : [];
      await window.storage.set(`gc:j:${user.email}`,
        JSON.stringify([entry, ...entries.filter(e => e.date !== entry.date)].slice(0, 90))
      );
    } catch (_) {}
    setJSaved(true);
    setTimeout(() => setJSaved(false), 2500);
    showToast("Journal entry saved ✓");
  }

  function downloadJournal() {
    const today = new Date();
    const ds = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const moods = { Great: "😊", Calm: "😌", Focused: "🎯", Stressed: "😤", Tired: "😴", Low: "😔" };
    const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const mediaHtml = jMedia.map(m =>
      m.type === "image"
        ? `<img src="${m.data}" alt="${esc(m.name)}" style="max-width:100%;margin:14px 0;border-radius:10px;display:block;box-shadow:0 2px 12px rgba(0,0,0,0.1);">`
        : m.type === "video"
          ? `<video controls style="max-width:100%;margin:14px 0;border-radius:10px;display:block;"><source src="${m.data}"></video>`
          : `<audio controls style="width:100%;margin:14px 0;display:block;"><source src="${m.data}"></audio>`
    ).join("\n");
    const stepsInfo = activeGoal ? `${activeGoal.completedSteps.length} of ${activeGoal.steps.length}` : "—";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GoalCoach Journal — ${today.toDateString()}</title>
<style>
@page { size: 8.5in 11in; margin: 1in; }
*, *::before, *::after { box-sizing: border-box; }
body { font-family: Arial, sans-serif; color: #2c2c2c; line-height: 1.75; max-width: 6.5in; margin: 0 auto; background: #fff; }
.header { border-bottom: 2.5px solid #185FA5; padding-bottom: 22px; margin-bottom: 34px; }
.logo { font-size: 28px; font-weight: 700; color: #171717; }
.logo em { color: #185FA5; font-style: normal; }
.meta { font-size: 13px; color: #888; margin-top: 5px; }
.section { margin-bottom: 30px; page-break-inside: avoid; }
h2 { font-size: 11px; font-weight: 700; color: #185FA5; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; }
.mood-badge { display: inline-flex; align-items: center; gap: 8px; background: #f8f7f4; border: 1px solid #e8e5df; border-radius: 24px; padding: 8px 18px; font-size: 15px; }
.journal-body { font-size: 15px; line-height: 1.9; color: #333; background: #fafaf8; border-left: 3.5px solid #185FA5; padding: 18px 22px; border-radius: 0 10px 10px 0; white-space: pre-wrap; word-wrap: break-word; min-height: 72px; }
.goal-box { background: #f0f5f0; border-radius: 10px; padding: 16px 20px; }
.goal-box strong { display: block; font-size: 15px; color: #171717; margin-bottom: 6px; }
.goal-meta { font-size: 13px; color: #4a7c5a; margin-top: 4px; }
.stats { display: flex; gap: 18px; }
.stat { flex: 1; background: #f8f7f4; border-radius: 10px; padding: 16px 12px; text-align: center; border: 1px solid #e8e5df; }
.stat-num { font-size: 24px; font-weight: 700; color: #171717; }
.stat-lbl { font-size: 11px; color: #888; margin-top: 4px; }
.safety-note { background: #fff9f0; border: 1px solid #ffe4cc; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #7a4f00; line-height: 1.6; margin-bottom: 30px; }
.osiris-note { background: #f0f5f0; border: 1px solid #dde8dd; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #2a4a2e; line-height: 1.6; margin-bottom: 30px; }
.footer { border-top: 1px solid #e8e5df; margin-top: 44px; padding-top: 16px; font-size: 11px; color: #bbb; text-align: center; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Goal<em>Coach</em></div>
  <div class="meta">Daily Journal &middot; ${ds}</div>
  <div class="meta">${esc(user?.name || "Family Member")}</div>
</div>

<div class="safety-note">
  <strong>⚠️ A reminder:</strong> If anything you've written today feels heavy or hard to carry, please don't carry it alone.
  Call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline, US, 24/7) &middot; Text HOME to <strong>741741</strong> (Crisis Text Line) &middot; <strong>findahelpline.com</strong> (international).
</div>

<div class="osiris-note">
  <strong>✦ From Osiris:</strong> "Every page of this journal is evidence that you showed up. That matters more than you know."
</div>

<div class="section">
  <h2>Mood</h2>
  <div class="mood-badge">${moods[jMood] || "•"} ${jMood || "Not recorded today"}</div>
</div>

${activeGoal ? `<div class="section">
  <h2>Active Goal</h2>
  <div class="goal-box">
    <strong>${esc(activeGoal.text)}</strong>
    ${focusTask ? `<div>Today's focus: ${esc(focusTask.title)}</div>` : ""}
    <div class="goal-meta">${stepsInfo} steps complete</div>
  </div>
</div>` : ""}

<div class="section">
  <h2>Journal Entry</h2>
  <div class="journal-body">${jText ? esc(jText) : "No entry written today."}</div>
</div>

${jMedia.length > 0 ? `<div class="section">
  <h2>Photos &amp; Media (${jMedia.length} file${jMedia.length !== 1 ? "s" : ""})</h2>
  ${mediaHtml}
</div>` : ""}

<div class="section">
  <h2>Today's Stats</h2>
  <div class="stats">
    <div class="stat"><div class="stat-num">🔥 ${streak}</div><div class="stat-lbl">day streak</div></div>
    <div class="stat"><div class="stat-num">${xp} XP</div><div class="stat-lbl">total earned</div></div>
    <div class="stat"><div class="stat-num">${stepsInfo}</div><div class="stat-lbl">steps done</div></div>
  </div>
</div>

<div class="footer">
  GoalCoach &middot; Your family's personal coaching companion &middot; Printed ${today.toLocaleDateString()}<br>
  <em>Crisis support: 988 Lifeline (call/text, US) &middot; Crisis Text Line: text HOME to 741741 &middot; findahelpline.com</em>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goalcoach-journal-${today.toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast("Journal downloaded ↓");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Loading
  if (view === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.beige, fontFamily: "Arial,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.dark }}>Goal<span style={{ color: C.blue }}>Coach</span></div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Loading…</div>
      </div>
    </div>
  );

  // Login
  if (view === "login") return (
    <div style={{ background: C.beige, minHeight: "100vh", fontFamily: "Arial,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: C.dark, letterSpacing: "-0.5px" }}>Goal<span style={{ color: C.blue }}>Coach</span></div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 32 }}>Your family's personal coaching companion</div>
      <div style={{ background: C.white, borderRadius: 16, padding: 28, width: "100%", maxWidth: 340, border: `0.5px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", marginBottom: 22, border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {[["signin", "Sign in"], ["signup", "Create account"]].map(([t, l]) => (
            <button key={t} onClick={() => { setLoginTab(t); setAuthErr(""); }} style={{ flex: 1, height: 36, background: loginTab === t ? C.dark : "transparent", color: loginTab === t ? "#fff" : C.muted, border: "none", fontFamily: "Arial,sans-serif", fontSize: 13, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {loginTab === "signup" && <>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>Full name</div>
          <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Sarah Johnson" style={{ width: "100%", height: 38, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 14, fontFamily: "Arial,sans-serif", background: C.light, marginBottom: 12, outline: "none" }} />
        </>}
        <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>Email</div>
        <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ width: "100%", height: 38, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 14, fontFamily: "Arial,sans-serif", background: C.light, marginBottom: 12, outline: "none" }} />
        <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>Password</div>
        <input value={authPass} onChange={e => setAuthPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === "Enter" && (loginTab === "signin" ? doLogin() : doSignup())} style={{ width: "100%", height: 38, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 14, fontFamily: "Arial,sans-serif", background: C.light, marginBottom: 12, outline: "none" }} />
        {authErr && <div style={{ fontSize: 13, color: C.coral, marginBottom: 10 }}>{authErr}</div>}
        <button onClick={loginTab === "signin" ? doLogin : doSignup} style={{ width: "100%", height: 40, background: C.dark, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer", fontWeight: 500 }}>
          {loginTab === "signin" ? "Sign in" : "Create account"}
        </button>
      </div>
    </div>
  );

  // Onboarding
  if (view === "onboard") {
    const q = ONBOARD_QS[obStep];
    return (
      <div style={{ background: C.beige, minHeight: "100vh", fontFamily: "Arial,sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 380, margin: "0 auto", paddingTop: 52 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Goal<span style={{ color: C.blue }}>Coach</span></div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Let's personalise your experience</div>
          <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 26, overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.blue, borderRadius: 4, width: `${((obStep + 1) / ONBOARD_QS.length) * 100}%`, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Question {obStep + 1} of {ONBOARD_QS.length}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 24, lineHeight: 1.3 }}>{q.q}</div>
          {q.opts.map((opt, i) => {
            const sel = obAnswers[q.key] === opt;
            return (
              <div key={i} onClick={() => setObAnswers(a => ({ ...a, [q.key]: opt }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: sel ? C.blueLight : C.white, border: `0.5px solid ${sel ? C.blue : C.border}`, borderRadius: 10, marginBottom: 10, cursor: "pointer", fontSize: 14, color: sel ? C.blue : "#333", transition: "all 0.15s" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${sel ? C.blue : "#ccc"}`, background: sel ? C.blue : "transparent", flexShrink: 0 }} />
                {opt}
              </div>
            );
          })}
          <button onClick={() => obAnswers[q.key] ? (obStep < ONBOARD_QS.length - 1 ? setObStep(s => s + 1) : finishOnboard()) : null} style={{ width: "100%", height: 42, background: obAnswers[q.key] ? C.dark : "#ccc", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: obAnswers[q.key] ? "pointer" : "default", marginTop: 10 }}>
            {obStep < ONBOARD_QS.length - 1 ? "Next →" : "Meet Osiris →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  const NAV = [
    { id: "home", emoji: "🏠", label: "Focus" },
    { id: "goals", emoji: "🎯", label: "Goals" },
    { id: "coach", label: "Osiris", isOsiris: true },
    { id: "journal", emoji: "📖", label: "Journal" },
  ];

  const HomeScreen = () => (
    <div style={{ padding: "20px 18px 24px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, color: C.muted }}>Good day, {user?.name?.split(" ")[0]} 👋</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginTop: 2 }}>Your one thing today</div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, paddingTop: 8 }}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>One step at a time, matched to your energy.</div>

      {/* Energy */}
      <div style={{ background: C.white, borderRadius: 14, padding: "16px", border: `0.5px solid ${C.border}`, marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>How's your energy right now?</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} onClick={() => setEnergy(n)} title={["Very low", "Low", "Medium", "High", "Very high"][n - 1]} style={{ flex: 1, height: 14 + n * 11, borderRadius: "4px 4px 0 0", background: n <= energy ? C.coral : C.border, cursor: "pointer", transition: "all 0.15s" }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.coral, fontWeight: 600 }}>
          {energy <= 2 ? "Low energy — gentle step today 🌱" : energy === 3 ? "Medium energy — steady pace ⚡" : "High energy — let's go! 🚀"}
        </div>
      </div>

      {/* Focus task */}
      {activeGoal && focusTask ? (
        <div style={{ background: C.white, borderRadius: 14, padding: "18px 16px", border: `0.5px solid ${C.border}`, marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 8 }}>STEP {focusTask.step} OF {activeGoal.steps.length}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, lineHeight: 1.4, marginBottom: 6 }}>{focusTask.title}</div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 4 }}>{focusTask.description}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Est. {focusTask.estimatedMinutes} min &nbsp;·&nbsp; {activeGoal.text.length > 44 ? activeGoal.text.slice(0, 44) + "…" : activeGoal.text}</div>
          {recalNote && <div style={{ fontSize: 12, color: C.sage, marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>🌿 {recalNote}</div>}
          {aiMsg && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{aiMsg}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={completeTask} style={{ flex: 1, height: 40, background: C.dark, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer", fontWeight: 600 }}>✓ Done</button>
            <button onClick={handleRecalibrate} disabled={aiLoading} style={{ flex: 1, height: 40, background: C.white, color: C.dark, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer" }}>{aiLoading ? "…" : "⟳ Recalibrate"}</button>
          </div>
        </div>
      ) : (
        <div style={{ background: C.white, borderRadius: 14, padding: "30px 22px", border: `0.5px solid ${C.border}`, marginBottom: 12, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>No active goal yet</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.55 }}>Add a goal and your plan will be built automatically — step by step.</div>
          <button onClick={() => setView("goals")} style={{ height: 38, padding: "0 22px", background: C.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer" }}>Add your first goal</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[["🔥 " + streak, "day streak"], [xp + " XP", "earned"], [activeGoal ? `${activeGoal.completedSteps.length}/${activeGoal.steps.length}` : "—", "steps done"]].map(([n, l]) => (
          <div key={l} style={{ flex: 1, background: C.white, borderRadius: 12, padding: "12px 8px", border: `0.5px solid ${C.border}`, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{n}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div style={{ background: C.white, borderRadius: 14, padding: "16px", border: `0.5px solid ${C.border}`, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12 }}>This week's activity</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 68, marginBottom: 6 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
            const base = [34, 50, 58, 24, 54, 68, 44];
            const boost = Math.min(20, (activeGoal?.completedSteps.length || 0) * 3);
            const todayIdx = (new Date().getDay() + 6) % 7;
            return <div key={d} style={{ flex: 1, height: Math.min(68, base[i] + boost), borderRadius: "4px 4px 0 0", background: i === todayIdx ? C.blue : i < todayIdx ? "#b8cfe0" : C.border }} />;
          })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div key={d} style={{ flex: 1, fontSize: 10, color: C.muted, textAlign: "center" }}>{d}</div>
          ))}
        </div>
      </div>

      <button onClick={doSignOut} style={{ width: "100%", height: 36, background: "transparent", color: C.muted, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "Arial,sans-serif", cursor: "pointer" }}>Sign out</button>
    </div>
  );

  const GoalsScreen = () => (
    <div style={{ padding: "20px 18px 24px", overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Your goals</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Type a goal — your action plan is built automatically.</div>

      <div style={{ background: C.white, borderRadius: 14, padding: 18, border: `0.5px solid ${C.border}`, marginBottom: 22, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginBottom: 10 }}>Add a new goal</div>
        <textarea value={newGoalText} onChange={e => setNewGoalText(e.target.value)} placeholder="e.g. Launch my freelance portfolio by end of next month…" style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: "Arial,sans-serif", background: C.light, resize: "none", height: 84, outline: "none", lineHeight: 1.55 }} />
        {aiMsg && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{aiMsg}</div>}
        <button onClick={addGoal} disabled={aiLoading || !newGoalText.trim()} style={{ width: "100%", height: 40, background: newGoalText.trim() && !aiLoading ? C.blue : "#ccc", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: newGoalText.trim() ? "pointer" : "default", marginTop: 10, fontWeight: 500 }}>
          {aiLoading ? "Building your plan…" : "Build my step plan →"}
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "44px 20px", color: C.muted, fontSize: 14 }}>No goals yet — add one above.</div>
      ) : goals.map(g => {
        const pct = g.steps.length ? Math.round((g.completedSteps.length / g.steps.length) * 100) : 0;
        const isActive = g.id === activeGoalId;
        return (
          <div key={g.id} style={{ background: C.white, borderRadius: 14, padding: 18, border: `0.5px solid ${isActive ? C.blue : C.border}`, marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, lineHeight: 1.3, flex: 1, marginRight: 10 }}>{g.text}</div>
              {isActive && <div style={{ fontSize: 11, background: C.blueLight, color: C.blue, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap", fontWeight: 700 }}>Active</div>}
            </div>
            <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", background: pct === 100 ? C.sage : C.blue, borderRadius: 4, width: `${pct}%`, transition: "width 0.4s" }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{g.completedSteps.length} of {g.steps.length} steps · {pct}% complete</div>
            {g.steps.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: g.completedSteps.includes(s.step) ? C.blue : C.border, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {g.completedSteps.includes(s.step) && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ fontSize: 13, color: g.completedSteps.includes(s.step) ? C.muted : C.dark, textDecoration: g.completedSteps.includes(s.step) ? "line-through" : "none" }}>{s.title}</div>
              </div>
            ))}
            {g.steps.length > 4 && <div style={{ fontSize: 12, color: C.muted, marginTop: 2, marginLeft: 26 }}>+{g.steps.length - 4} more steps</div>}
            {!isActive && (
              <button onClick={() => { setActiveGoalId(g.id); const next = g.steps.find(s => !g.completedSteps.includes(s.step)); setFocusTask(next || null); setRecalNote(""); setView("home"); }} style={{ width: "100%", height: 34, background: "transparent", color: C.blue, border: `0.5px solid ${C.blue}`, borderRadius: 8, fontSize: 13, fontFamily: "Arial,sans-serif", cursor: "pointer", marginTop: 12 }}>
                Set as active goal
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const CoachScreen = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.sageBg }}>
      {/* Header */}
      <div style={{ background: C.white, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: `0.5px solid ${C.sageBorder}`, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, #4a7c5a, #2a4a2e)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.sageDark }}>Osiris</div>
          <div style={{ fontSize: 12, color: C.sageMid }}>CBT-informed coach · offline</div>
        </div>
        <div style={{ fontSize: 10, color: "#4a7c5a", background: "#e6f4ea", borderRadius: 10, padding: "3px 10px", fontWeight: 600 }}>SAFE MODE ✓</div>
      </div>

      {/* Safety banner */}
      <div style={{ background: "#fff8f0", borderBottom: `0.5px solid #ffe0c0`, padding: "8px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "#8a5000", lineHeight: 1.5 }}>
          Osiris is a coaching tool — not a crisis service. Need urgent support? Call or text <strong>988</strong> · Text HOME to <strong>741741</strong>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: "center", padding: "52px 24px", color: C.sageMid }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✦</div>
            <div style={{ fontSize: 14 }}>Osiris is ready when you are.</div>
          </div>
        )}
        {chatHistory.map((m, i) => (
          <div key={i} style={{ background: m.role === "osiris" ? C.white : C.sageDark, color: m.role === "osiris" ? "#2a3a2e" : "#fff", border: m.role === "osiris" ? `0.5px solid ${C.sageBorder}` : "none", borderRadius: m.role === "osiris" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", padding: "12px 14px", fontSize: 14, lineHeight: 1.65, maxWidth: "84%", marginLeft: m.role === "user" ? "auto" : 0, whiteSpace: "pre-wrap" }}>
            {m.content}
          </div>
        ))}
        {chatLoading && (
          <div style={{ background: C.white, border: `0.5px solid ${C.sageBorder}`, borderRadius: "4px 14px 14px 14px", padding: "12px 14px", fontSize: 14, color: C.sageMid, maxWidth: "52%" }}>
            Osiris is thinking… ✦
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: C.white, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center", borderTop: `0.5px solid ${C.sageBorder}`, flexShrink: 0 }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()} placeholder="Talk to Osiris…" style={{ flex: 1, height: 38, border: `0.5px solid ${C.sageBorder}`, borderRadius: 20, padding: "0 14px", fontSize: 13, fontFamily: "Arial,sans-serif", background: C.sageBg, outline: "none" }} />
        <button onClick={() => startVoice(setChatInput)} title="Voice input" style={{ width: 38, height: 38, background: C.sage, border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8" /></svg>
        </button>
        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ width: 38, height: 38, background: C.sageDark, border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: chatLoading || !chatInput.trim() ? 0.45 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" /></svg>
        </button>
      </div>
    </div>
  );

  const JournalScreen = () => (
    <div style={{ padding: "20px 18px 28px", overflowY: "auto", height: "100%" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Daily journal</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 10 }}>How are you feeling?</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {[["Great", "😊"], ["Calm", "😌"], ["Focused", "🎯"], ["Stressed", "😤"], ["Tired", "😴"], ["Low", "😔"]].map(([label, emoji]) => (
          <div key={label} onClick={() => setJMood(label)} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, border: `0.5px solid ${jMood === label ? C.blue : C.border}`, background: jMood === label ? C.blue : C.white, color: jMood === label ? "#fff" : "#555", cursor: "pointer", transition: "all 0.12s" }}>{emoji} {label}</div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 8 }}>What's on your mind?</div>
      <div style={{ position: "relative", marginBottom: 18 }}>
        <textarea value={jText} onChange={e => setJText(e.target.value)} placeholder="Write freely — this is just for you…" style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px 14px 42px", fontSize: 14, fontFamily: "Arial,sans-serif", background: C.white, resize: "none", height: 144, outline: "none", lineHeight: 1.65, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
        <button onClick={() => startVoice(setJText)} title="Voice note" style={{ position: "absolute", bottom: 10, right: 10, width: 30, height: 30, background: "#f0ede8", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v4M8 23h8" /></svg>
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 8 }}>Add photos, audio, or video</div>
      <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" onChange={handleMedia} style={{ display: "none" }} />
      <button onClick={() => fileRef.current.click()} style={{ width: "100%", height: 40, background: C.white, color: C.dark, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer", marginBottom: 6 }}>📎 Attach files</button>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Max 5 MB per file · Images, audio &amp; video supported</div>

      {jMedia.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {jMedia.map((m, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {m.type === "image" && <img src={m.data} alt={m.name} style={{ width: "100%", borderRadius: 10, display: "block" }} />}
              {m.type === "video" && <video controls style={{ width: "100%", borderRadius: 10, display: "block" }}><source src={m.data} /></video>}
              {m.type === "audio" && <audio controls style={{ width: "100%", display: "block" }}><source src={m.data} /></audio>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.name}</div>
                <button onClick={() => setJMedia(p => p.filter((_, j) => j !== i))} style={{ fontSize: 12, color: C.coral, background: "none", border: "none", cursor: "pointer", marginLeft: 8, flexShrink: 0 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <button onClick={saveJournal} style={{ flex: 1, height: 42, background: jSaved ? C.sage : C.dark, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer", fontWeight: 500, transition: "background 0.2s" }}>
          {jSaved ? "✓ Saved!" : "Save entry"}
        </button>
        <button onClick={downloadJournal} style={{ flex: 1, height: 42, background: C.white, color: C.blue, border: `0.5px solid ${C.blue}`, borderRadius: 8, fontSize: 14, fontFamily: "Arial,sans-serif", cursor: "pointer", fontWeight: 500 }}>
          ↓ Download
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.65 }}>
        Downloads as an 8.5×11 HTML file — open in your browser, then File → Print → Save as PDF to keep it permanently.
      </div>
    </div>
  );

  const SCREENS = { home: HomeScreen, goals: GoalsScreen, coach: CoachScreen, journal: JournalScreen };
  const ActiveScreen = SCREENS[view] || HomeScreen;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", fontFamily: "Arial,sans-serif", background: view === "coach" ? C.sageBg : C.beige, overflow: "hidden" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: C.dark, color: "#fff", borderRadius: 20, padding: "8px 18px", fontSize: 13, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>{toast}</div>
      )}

      {/* Screen */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: view === "coach" ? "hidden" : "auto" }}>
        <ActiveScreen />
      </div>

      {/* Bottom nav */}
      <nav style={{ background: C.white, borderTop: `0.5px solid ${C.border}`, display: "flex", flexShrink: 0, zIndex: 10 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, height: 58, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            {n.isOsiris
              ? <span style={{ fontSize: 20, color: view === "coach" ? C.sage : C.muted }}>✦</span>
              : <span style={{ fontSize: 20 }}>{n.emoji}</span>
            }
            <span style={{ fontSize: 11, color: view === n.id ? (n.id === "coach" ? C.sage : C.blue) : C.muted, fontWeight: view === n.id ? 700 : 400, fontFamily: "Arial,sans-serif" }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
