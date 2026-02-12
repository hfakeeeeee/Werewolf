export type Phase = 'lobby' | 'night' | 'day' | 'voting' | 'results'
export type GameMode = 'classic' | 'custom'

export type Role = 'werewolf' | 'seer' | 'bodyguard' | 'villager' | 'hunter' | 'witch' | 'fool'
export type RoleCounts = Record<Role, number>

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
  bodyguardProtect?: string
  seerInspect?: string
  witchHeal?: boolean
  witchPoisonTarget?: string
}

export interface NightResult {
  killedId?: string
  killedIds?: string[]
  bodyguardSavedId?: string
  witchSavedId?: string
  witchPoisonedId?: string
  seerResult?: {
    targetId: string
    role: Role
  }
}

export interface WitchState {
  healUsed: boolean
  poisonUsed: boolean
}

export interface WitchTurn {
  pendingVictimId?: string
  action?: 'heal' | 'poison' | 'pass'
  poisonTargetId?: string
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
  gameMode?: GameMode
  customRoles?: Partial<RoleCounts>
  phaseEndsAt?: number
  nightStep?: 'main' | 'witch'
  bodyguardLastProtectedId?: string
  votes?: Record<string, string>
  nightActions?: NightActions
  witchState?: WitchState
  witchTurn?: WitchTurn
  lastNight?: NightResult
  lastEliminated?: string[]
  hunterPending?: string
  winner?: 'villagers' | 'werewolves' | 'fool'
  winReason?: string
  chat?: ChatMessage[]
}
