export interface Profile {
  id: string
  display_name: string
  onboarded: boolean
  profile_data: {
    style?: string
    block?: string
    peak?: string
    motive?: string
  }
  created_at: string
}

export interface GoalStep {
  step: number
  title: string
  description: string
  estimatedMinutes: number
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  status: 'active' | 'pending' | 'completed'
  steps: GoalStep[]
  current_step: number
  xp: number
  streak: number
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'osiris'
  content: string
}

export interface MediaItem {
  type: 'image' | 'video' | 'audio'
  name: string
  data: string
}

// Design tokens — one source of truth for all pages
export const C = {
  beige:    '#f8f7f4',
  dark:     '#171717',
  blue:     '#185FA5',
  blueLight:'#EBF4FF',
  coral:    '#D85A30',
  sage:     '#4a7c5a',
  sageBg:   '#f0f5f0',
  sageDark: '#2a4a2e',
  sageMid:  '#6a946e',
  sageBd:   '#dde8dd',
  white:    '#ffffff',
  border:   '#e8e5df',
  muted:    '#888888',
  light:    '#fafaf8',
} as const
