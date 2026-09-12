import type { GoalStep } from './types'

const TEMPLATES: Record<string, Omit<GoalStep, 'step'>[]> = {
  fitness: [
    { title: 'Set your honest baseline', description: 'Write down exactly where you are now — what you can do, how you feel. No judgement, just data.', estimatedMinutes: 20 },
    { title: 'Define a measurable target', description: "Make it specific: '30-minute run without stopping by Oct 31.' Not just 'get fit.'", estimatedMinutes: 15 },
    { title: 'Choose ONE program and commit', description: 'Research 2–3 options and pick just one. Starting beats optimising.', estimatedMinutes: 30 },
    { title: 'Remove all friction', description: 'Set out your gear tonight, clear a workout space, put your shoes by the door.', estimatedMinutes: 20 },
    { title: 'Block 4 sessions in your calendar', description: 'Treat them like appointments. Same time each day builds the habit faster.', estimatedMinutes: 15 },
    { title: 'Complete session 1', description: 'Do it. Imperfect is fine — done is the only thing that counts.', estimatedMinutes: 45 },
    { title: 'Find one accountability partner', description: 'Tell one person your goal and ask them to check in every Sunday.', estimatedMinutes: 15 },
    { title: 'Review after 3 sessions', description: "What's working? What needs adjusting? Don't wait a month to course-correct.", estimatedMinutes: 20 },
    { title: 'Build your recovery routine', description: 'Plan sleep, stretching, and nutrition — not as an afterthought.', estimatedMinutes: 25 },
  ],
  business: [
    { title: 'Write your one-sentence offer', description: 'Who do you serve, what do you help them do, and what result do they get? One sentence only.', estimatedMinutes: 30 },
    { title: 'List your first 5 prospects', description: 'Name 5 real people or businesses who could benefit from what you offer right now.', estimatedMinutes: 20 },
    { title: 'Research 3 competitors', description: 'Note what they charge, how they position, and what they miss.', estimatedMinutes: 35 },
    { title: 'Build a minimal portfolio', description: '2–3 samples of your work. Real is better, but concept pieces work if you\'re starting.', estimatedMinutes: 45 },
    { title: 'Set your price', description: 'Research market rates, then set a number you can say out loud without flinching.', estimatedMinutes: 20 },
    { title: 'Write a personal outreach message', description: 'Short, genuine, and human. No templates — be yourself.', estimatedMinutes: 25 },
    { title: 'Send your first outreach', description: 'Send to at least 3 people today. Done beats perfect every time.', estimatedMinutes: 20 },
    { title: 'Follow up once', description: 'No response after 5 days? One polite follow-up, then move on.', estimatedMinutes: 15 },
    { title: 'Run your first discovery call', description: 'Listen 70%, talk 30%. Ask more than you tell.', estimatedMinutes: 30 },
  ],
  learning: [
    { title: 'Define the exact outcome', description: "Not 'learn Python' — 'build a working expense tracker in 60 days.'", estimatedMinutes: 20 },
    { title: 'Choose ONE resource and commit', description: 'Pick a single course or book. Finish it before starting another.', estimatedMinutes: 25 },
    { title: 'Block a daily practice window', description: '20–30 minutes, same time every day. Consistency beats intensity.', estimatedMinutes: 15 },
    { title: 'Complete session 1 today', description: "Don't wait for the right time. Start now and take brief notes.", estimatedMinutes: 30 },
    { title: 'Teach it to someone', description: "Explain the first concept to someone else. If you can't explain it, you haven't learned it yet.", estimatedMinutes: 20 },
    { title: 'Find a practice partner', description: 'One person on the same learning path — accountability and practice together.', estimatedMinutes: 20 },
    { title: 'Complete your first milestone', description: 'Finish the first chapter or unit. Celebrate it — it counts.', estimatedMinutes: 40 },
    { title: 'Isolate your sticking point', description: "What's the hardest concept so far? Spend focused time just on that.", estimatedMinutes: 35 },
    { title: 'Apply it in a real context', description: "Use your new skill in real life — imperfectly. That's where learning sticks.", estimatedMinutes: 30 },
  ],
  writing: [
    { title: 'Define audience and purpose', description: 'Who reads this, and what do you want them to think, feel, or do after reading?', estimatedMinutes: 20 },
    { title: 'Write a rough outline', description: 'Bullet points only. 5–7 main ideas, ordered logically. Map before you write.', estimatedMinutes: 25 },
    { title: 'Write a messy first draft', description: "No editing allowed. Get it all out. You can't edit a blank page.", estimatedMinutes: 45 },
    { title: 'Step away for 24 hours', description: "Don't touch it. Let your brain reset. This step is non-negotiable.", estimatedMinutes: 10 },
    { title: 'Cut your first paragraph', description: 'Most writing buries the real opening. Where does it actually start?', estimatedMinutes: 20 },
    { title: 'Read it aloud', description: 'Your ears catch what your eyes miss. Read every sentence out loud.', estimatedMinutes: 20 },
    { title: 'Get one piece of feedback', description: 'Ask one trusted person what confused them. Just that one question.', estimatedMinutes: 25 },
    { title: 'Final edit', description: "Fix grammar, tighten sentences, cut filler words: 'very,' 'really,' 'just.'", estimatedMinutes: 30 },
    { title: 'Publish or submit', description: "Done is better than perfect. Hit send, post it, or submit it.", estimatedMinutes: 15 },
  ],
  default: [
    { title: 'Define exactly what success looks like', description: 'Write it down: what specifically will be different when this goal is complete?', estimatedMinutes: 20 },
    { title: 'Identify your biggest obstacle', description: "What's most likely to stop you? Write it down and plan around it.", estimatedMinutes: 20 },
    { title: "Find 2 people who've done this", description: 'How did they approach it? What would they do differently?', estimatedMinutes: 30 },
    { title: 'Build a rough 30-day map', description: 'What does consistent progress look like? Rough outline only.', estimatedMinutes: 25 },
    { title: 'Take your first action today', description: 'The smallest possible first move, right now. Momentum starts here.', estimatedMinutes: 30 },
    { title: 'Set up your environment', description: 'Arrange tools, space, and calendar so starting requires zero effort.', estimatedMinutes: 20 },
    { title: 'Build your accountability system', description: "Weekly check-in with yourself or someone else. What's working?", estimatedMinutes: 15 },
    { title: 'Handle the resistance', description: "When the wall hits, name what's stopping you and take the smallest action.", estimatedMinutes: 25 },
    { title: 'Celebrate and reset', description: "Acknowledge what you've done. Then set the next milestone. Progress compounds.", estimatedMinutes: 15 },
  ],
}

export function generateGoalSteps(title: string): GoalStep[] {
  let template: Omit<GoalStep, 'step'>[]

  if (/fitness|workout|exercise|weight|run|gym|diet|nutrition|physic/i.test(title))
    template = TEMPLATES.fitness
  else if (/business|freelanc|client|income|revenue|entrepreneur|startup|brand|launch/i.test(title))
    template = TEMPLATES.business
  else if (/learn|study|course|skill|language|code|program|degree|certif|master/i.test(title))
    template = TEMPLATES.learning
  else if (/write|book|blog|article|essay|content|publish|novel|script|story/i.test(title))
    template = TEMPLATES.writing
  else
    template = TEMPLATES.default

  return template.map((s, i) => ({ ...s, step: i + 1 }))
}

export function recalibrateStep(
  steps: GoalStep[],
  currentStep: number,
  energy: number
): { step: GoalStep; reason: string } | null {
  const remaining = steps.filter(s => s.step > currentStep)
  if (!remaining.length) return null

  const sorted = [...remaining].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)

  if (energy <= 2) {
    return {
      step: sorted[0],
      reason: 'Low energy today — this gentle step keeps your streak alive without burning you out. 🌱',
    }
  }
  if (energy >= 4) {
    return {
      step: sorted[sorted.length - 1],
      reason: 'High energy — this is the moment to tackle the most demanding step. 🚀',
    }
  }
  const mid = remaining[Math.floor(remaining.length / 2)] ?? remaining[0]
  return {
    step: mid,
    reason: 'Steady energy calls for a steady step — not too light, not too heavy.',
  }
}
