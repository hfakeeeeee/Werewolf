export type Phase = 'lobby' | 'night' | 'day' | 'voting' | 'results'

export type Role = 'werewolf' | 'seer' | 'doctor' | 'villager' | 'hunter'

export interface Player {
  id: string
  name: string
  isHost: boolean
  isAlive: boolean
  isReady: boolean
  role?: Role
  joinedAt: number
}

export interface NightActions {
  werewolfTarget?: string
  doctorSave?: string
  seerInspect?: string
}

export interface NightResult {
  killedId?: string
  savedId?: string
  seerResult?: {
    targetId: string
    role: Role
  }
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  audience?: 'all' | 'werewolves'
  createdAt: number
}

export interface Room {
  id: string
  code: string
  status: Phase
  hostId: string
  createdAt: number
  updatedAt: number
  players: Record<string, Player>
  dayCount: number
  phaseEndsAt?: number
  votes?: Record<string, string>
  nightActions?: NightActions
  lastNight?: NightResult
  lastEliminated?: string[]
  winner?: 'villagers' | 'werewolves'
  winReason?: string
  chat?: ChatMessage[]
}
