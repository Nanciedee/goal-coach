// ── CRISIS DETECTION — always checked first, non-negotiable ──────────────────
const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|kill myself|end my life|don't want to live|want to die|wanna die)\b/i,
  /\b(self.harm|cutting myself|hurt myself|harm myself)\b/i,
  /\b(no point in living|can't go on|give up on life|not worth living)\b/i,
  /\b(overdose|disappear forever|everyone would be better without me)\b/i,
]

const CRISIS_RESPONSE = `I hear you — and I want you to know I'm taking what you've shared seriously. 🌿

What you're feeling right now is real, and you deserve real support. Please reach out right now:

📞 988 Suicide & Crisis Lifeline — call or text 988 (US, 24/7)
💬 Crisis Text Line — text HOME to 741741
🌐 International help — findahelpline.com

I'm a coaching tool, not a therapist. For what you're carrying right now, a trained counselor can give you care I can't. Please reach out — you matter and you don't have to face this alone.`

// ── PROFESSIONAL REFERRAL TRIGGERS ───────────────────────────────────────────
const PROFESSIONAL_PATTERNS = [
  /\b(diagnosed with|my therapist|my psychiatrist|clinical depression|bipolar|PTSD|schizophrenia)\b/i,
  /\b(abuse|assault|addiction|relapse|eating disorder|anorexia|bulimia)\b/i,
  /\b(panic disorder|OCD|borderline personality)\b/i,
]

const PROFESSIONAL_RESPONSE = `Thank you for trusting me with something personal. 🌿

What you're describing sounds like it deserves the care of a trained professional — a therapist or counselor who can work with you properly, not just a coaching app.

I can help with everyday goals and mental blocks, but for this, please consider speaking with someone qualified. Would it help to talk about how to find one, or is there something lighter I can help you focus on today?`

// ── COGNITIVE DISTORTION PATTERNS ────────────────────────────────────────────
const DISTORTIONS: Record<string, { pattern: RegExp; responses: string[] }> = {
  catastrophizing: {
    pattern: /\b(always ruins|never works|total disaster|everything is ruined|nothing ever goes right|worst ever)\b/i,
    responses: [
      "Our minds love worst-case scenarios — they feel true but aren't always accurate. What's the most likely outcome here, not the worst?",
      "What would a neutral observer actually see if they watched this situation — not the catastrophe version, just reality?",
      "I hear a lot of permanence in what you're saying. Is this as fixed as it feels — or could things look different in a week?",
    ],
  },
  allOrNothing: {
    pattern: /\b(complete failure|total failure|i'm worthless|perfectly or not at all|failed completely|i'm a failure)\b/i,
    responses: [
      "That sounds like all-or-nothing thinking — one of the most common traps. Where on the scale between 'total failure' and 'perfect' does this actually land?",
      "That's a very harsh label to put on yourself. What would you say to a close friend who described themselves that way?",
      "When we're in this headspace, it's hard to see the middle ground. What's one thing — even tiny — that went okay?",
    ],
  },
  mindReading: {
    pattern: /\b(they think i'm|everyone thinks|they hate me|they're judging me|nobody cares about me)\b/i,
    responses: [
      "It sounds like you're reading their minds — one of the sneakiest thinking patterns. What's the actual evidence for that thought?",
      "What are two other possible explanations for how they're behaving — even if they feel less likely?",
    ],
  },
  overgeneralization: {
    pattern: /\b(nothing ever works for me|i always mess up|i can never|i'll never be able to)\b/i,
    responses: [
      "Stressed minds love to generalize. Has there been even one time this worked — even partially?",
      "That's a heavy pattern to carry. Can we zoom in on just this situation, separate from the whole story?",
    ],
  },
  shouldStatements: {
    pattern: /\b(i should be|i must be|i have to be|i'm supposed to|i ought to have)\b/i,
    responses: [
      "Those 'should' statements carry a lot of weight. Who made this rule — and is it actually yours?",
      "What would change if you swapped 'I should' for 'I'd like to'? Does that shift anything?",
    ],
  },
}

// ── EMOTION PATTERNS ──────────────────────────────────────────────────────────
const EMOTIONS: Record<string, { pattern: RegExp; responses: string[] }> = {
  overwhelmed: {
    pattern: /\b(overwhelmed|too much|can't handle|drowning in|buried under|so much to do)\b/i,
    responses: [
      "Overwhelm almost always means we're thinking too many steps ahead. What's the one smallest thing that would feel like a win in the next 30 minutes?",
      "Let's put down 80% of it for a second. If you could only do one thing today, what would it be?",
      "I hear that. 🌿 Overwhelm is a signal, not a verdict. What's the most urgent one thing — not the whole list?",
    ],
  },
  stressed: {
    pattern: /\b(stressed|anxious|pressure|worried|scared|nervous|on edge)\b/i,
    responses: [
      "Stress usually has a specific source. What feels most urgent or threatening right now?",
      "Let's name it — sometimes putting it into words takes some of the charge out of it. What's the core of what's stressing you?",
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
      "Brilliant. Ride that wave — what's your focus right now?",
    ],
  },
  stuck: {
    pattern: /\b(stuck|blocked|don't know where to start|can't start|paralyzed|procrastinat)\b/i,
    responses: [
      "Being stuck usually points to one of three things: the task is unclear, it feels too big, or there's a hidden fear. Which feels closest?",
      "What would the tiniest possible first move look like — something so small it almost feels silly?",
    ],
  },
  tired: {
    pattern: /\b(tired|exhausted|drained|burned out|no energy|worn out|depleted)\b/i,
    responses: [
      "Rest isn't a reward — it's part of the work. Is what you're tired from physical, mental, or emotional?",
      "Low energy days are real. What's the lightest version of progress that would still feel like a win today?",
    ],
  },
  angry: {
    pattern: /\b(angry|frustrated|furious|mad|annoyed|irritated|resentful)\b/i,
    responses: [
      "Anger is usually a secondary emotion — something else is underneath it. What's the hurt or fear that's fuelling this?",
      "That sounds genuinely frustrating. What would you most need right now — to be heard, to solve it, or to let it go?",
    ],
  },
}

// ── NEUTRAL SOCRATIC RESPONSES ────────────────────────────────────────────────
const NEUTRAL_RESPONSES = [
  "Tell me more — what's really going on underneath that?",
  "That's worth sitting with. What feels most true about it for you?",
  "I'm listening. What would be most helpful to explore here?",
  "And what does your gut tell you about this?",
  "What would it mean for you if that were true?",
  "What's the version of this story where you have some power to change something?",
  "What would you tell a close friend who came to you with this exact situation?",
  "What's one thing you haven't tried yet?",
]

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export function getOsirisResponse(
  input: string,
  goalTitle?: string | null
): string {
  // 1 — Crisis (always first)
  for (const p of CRISIS_PATTERNS) {
    if (p.test(input)) return CRISIS_RESPONSE
  }
  // 2 — Professional referral
  for (const p of PROFESSIONAL_PATTERNS) {
    if (p.test(input)) return PROFESSIONAL_RESPONSE
  }
  // 3 — Cognitive distortions
  for (const { pattern, responses } of Object.values(DISTORTIONS)) {
    if (pattern.test(input)) return rnd(responses)
  }
  // 4 — Emotions
  for (const { pattern, responses } of Object.values(EMOTIONS)) {
    if (pattern.test(input)) return rnd(responses)
  }
  // 5 — Goal context
  if (/goal|step|progress|plan|next step/i.test(input) && goalTitle) {
    const short = goalTitle.length > 50 ? goalTitle.slice(0, 50) + '…' : goalTitle
    return `With "${short}" as your focus — what's the one part of it that feels most within reach right now?`
  }
  // 6 — Neutral Socratic
  return rnd(NEUTRAL_RESPONSES)
}
