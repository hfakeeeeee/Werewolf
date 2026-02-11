export type Phase = 'lobby' | 'night' | 'day' | 'voting' | 'results'

export type Role = 'werewolf' | 'seer' | 'doctor' | 'villager' | 'hunter'

export interface Player {
  id: string
  name: string
  isHost: boolean
  isAlive: boolean
  role?: Role
  joinedAt: number
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
}
