import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { NightActions, Phase, Player, Role, Room } from '../lib/types'

const rolesPalette: Role[] = ['werewolf', 'seer', 'doctor', 'hunter', 'villager']
const minPlayers = 4

const phaseLabels: Record<Phase, string> = {
  lobby: 'Lobby',
  night: 'Night',
  day: 'Day',
  voting: 'Voting',
  results: 'Results',
}

const phaseDurations: Record<Exclude<Phase, 'lobby' | 'results'>, number> = {
  night: 45,
  day: 60,
  voting: 30,
}

function getPlayerId() {
  const key = 'ww_player_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const created = crypto.randomUUID()
  localStorage.setItem(key, created)
  return created
}

function getStoredName() {
  return localStorage.getItem('ww_player_name') ?? ''
}

function storeName(name: string) {
  localStorage.setItem('ww_player_name', name)
}

function generateRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildRoleDeck(count: number): Role[] {
  const werewolves = Math.max(1, Math.floor(count / 4))
  const deck: Role[] = Array.from({ length: werewolves }, () => 'werewolf')
  if (count >= 5) deck.push('seer')
  if (count >= 6) deck.push('doctor')
  if (count >= 7) deck.push('hunter')
  while (deck.length < count) deck.push('villager')
  return shuffle(deck)
}

function nextPhase(current: Phase): Phase {
  switch (current) {
    case 'night':
      return 'day'
    case 'day':
      return 'voting'
    case 'voting':
      return 'night'
    default:
      return 'night'
  }
}

function computeVoteResult(votes: Record<string, string> | undefined) {
  if (!votes) return null
  const tally: Record<string, number> = {}
  Object.values(votes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] ?? 0) + 1
  })
  const entries = Object.entries(tally).filter(([id]) => id !== 'skip')
  if (entries.length === 0) return null
  entries.sort((a, b) => b[1] - a[1])
  if (entries.length > 1 && entries[0][1] === entries[1][1]) {
    return { targetId: null, votes: entries[0][1], isTie: true }
  }
  return {
    targetId: entries[0][0],
    votes: entries[0][1],
    isTie: false,
  }
}

function resolveNight(
  players: Player[],
  nightActions: NightActions | undefined
): { killedId?: string; savedId?: string; seerResult?: { targetId: string; role: Role } } {
  if (!nightActions) return {}
  const killedId = nightActions.werewolfTarget
  const savedId = nightActions.doctorSave
  const killedFinal = killedId && killedId !== savedId ? killedId : undefined
  const seerTarget = nightActions.seerInspect
  const seerPlayer = players.find((p) => p.id === seerTarget)
  const result: {
    killedId?: string
    savedId?: string
    seerResult?: { targetId: string; role: Role }
  } = {}

  if (killedFinal) result.killedId = killedFinal
  if (savedId) result.savedId = savedId
  if (seerPlayer) {
    result.seerResult = {
      targetId: seerPlayer.id,
      role: seerPlayer.role ?? 'villager',
    }
  }

  return result
}

function computeWinner(players: Player[]) {
  const alive = players.filter((p) => p.isAlive)
  const aliveWerewolves = alive.filter((p) => p.role === 'werewolf').length
  const aliveVillagers = alive.length - aliveWerewolves
  if (aliveWerewolves === 0 && alive.length > 0) {
    return { winner: 'villagers' as const, reason: 'All werewolves are eliminated.' }
  }
  if (aliveWerewolves >= aliveVillagers && alive.length > 0) {
    return { winner: 'werewolves' as const, reason: 'Werewolves have majority control.' }
  }
  return null
}

export interface RoomState {
  playerId: string
  playerName: string
  setPlayerName: (name: string) => void
  roomCode: string
  setRoomCode: (code: string) => void
  activeCode: string
  setActiveCode: (code: string) => void
  room: Room | null
  status: string
  error: string
  loading: boolean
  me: Player | undefined
  isHost: boolean
  rolesPalette: Role[]
  phaseLabels: Record<Phase, string>
  minPlayers: number
  countdown: number | null
  createRoom: () => Promise<string | null>
  joinRoom: () => Promise<string | null>
  leaveRoom: () => Promise<void>
  rejoinRoom: () => Promise<void>
  toggleReady: () => Promise<void>
  startGame: () => Promise<void>
  advancePhase: () => Promise<void>
  resetLobby: () => Promise<void>
  setVote: (targetId: string) => Promise<void>
  setNightAction: (update: Partial<NightActions>) => Promise<void>
  sendChat: (message: string) => Promise<void>
  sendHunterShot: (targetId: string) => Promise<void>
}

const RoomContext = createContext<RoomState | null>(null)

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const playerId = useMemo(() => getPlayerId(), [])
  const [playerName, setPlayerName] = useState(getStoredName())
  const [roomCode, setRoomCode] = useState('')
  const [activeCode, setActiveCode] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rejoining, setRejoining] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!activeCode) return
    const ref = doc(db, 'rooms', activeCode)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setRoom(null)
        setActiveCode('')
        setError('Room ended.')
        return
      }
      setRoom(snap.data() as Room)
    })
    return () => unsub()
  }, [activeCode])

  useEffect(() => {
    if (!room) return
    if (room.players?.[playerId]) return
    if (rejoining) return

    const storedName = getStoredName().trim()
    if (!storedName) return

    setRejoining(true)
    const ref = doc(db, 'rooms', room.code)
    updateDoc(ref, {
      updatedAt: Date.now(),
      [`players.${playerId}`]: {
        id: playerId,
        name: storedName,
        isHost: room.hostId === playerId,
        isAlive: true,
        isReady: false,
        joinedAt: Date.now(),
      },
    }).finally(() => setRejoining(false))
  }, [playerId, rejoining, room])

  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby' || room.status === 'results') return
    if (!room.players?.[playerId]?.isHost) return

    const seconds = phaseDurations[room.status as keyof typeof phaseDurations]
    if (!seconds) return

    if (!room.phaseEndsAt || room.phaseEndsAt < Date.now()) {
      updateDoc(doc(db, 'rooms', room.code), {
        phaseEndsAt: Date.now() + seconds * 1000,
        updatedAt: Date.now(),
      })
    }
  }, [playerId, room])

  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby' || room.status === 'results') return
    if (!room.players?.[playerId]?.isHost) return
    if (!room.phaseEndsAt) return
    if (now < room.phaseEndsAt) return
    advancePhase()
  }, [now, playerId, room])

  const me = room?.players?.[playerId]
  const isHost = me?.isHost ?? false

  const createRoom = async () => {
    const name = playerName.trim()
    if (!name) {
      setError('Please enter a name.')
      return null
    }
    storeName(name)
    setError('')
    setStatus('Creating room...')
    setLoading(true)

    let code = ''
    let exists = true
    let attempts = 0
    while (exists && attempts < 5) {
      attempts += 1
      code = generateRoomCode()
      const existing = await getDoc(doc(db, 'rooms', code))
      exists = existing.exists()
    }
    if (exists) {
      setLoading(false)
      setStatus('')
      setError('Could not create a unique room code. Try again.')
      return null
    }

    const nowStamp = Date.now()
    const player: Player = {
      id: playerId,
      name,
      isHost: true,
      isAlive: true,
      isReady: false,
      joinedAt: nowStamp,
    }

    const roomData: Room = {
      id: code,
      code,
      status: 'lobby',
      hostId: playerId,
      createdAt: nowStamp,
      updatedAt: nowStamp,
      players: { [playerId]: player },
      dayCount: 0,
    }

    await setDoc(doc(db, 'rooms', code), roomData)
    setActiveCode(code)
    setRoomCode(code)
    setStatus('')
    setLoading(false)
    return code
  }

  const joinRoom = async () => {
    const name = playerName.trim()
    const code = roomCode.trim().toUpperCase()
    if (!name) {
      setError('Please enter a name.')
      return null
    }
    if (!code) {
      setError('Enter a room code.')
      return null
    }
    storeName(name)
    setError('')
    setStatus('Joining room...')
    setLoading(true)

    const ref = doc(db, 'rooms', code)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      setLoading(false)
      setStatus('')
      setError('Room not found.')
      return null
    }

    const nowStamp = Date.now()
    await setDoc(
      ref,
      {
        updatedAt: nowStamp,
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: false,
          isAlive: true,
          isReady: false,
          joinedAt: nowStamp,
        },
      },
      { merge: true }
    )

    setActiveCode(code)
    setRoomCode(code)
    setStatus('')
    setLoading(false)
    return code
  }

  const toggleReady = async () => {
    if (!room) return
    if (!me) {
      setError('You are not in this room. Please rejoin.')
      return
    }
    const ref = doc(db, 'rooms', room.code)
    await updateDoc(ref, {
      [`players.${playerId}.isReady`]: !me.isReady,
      updatedAt: Date.now(),
    })
  }

  const startGame = async () => {
    if (!room || !isHost) return
    const players = Object.values(room.players)
    if (players.length < minPlayers) {
      setError(`Need at least ${minPlayers} players to start.`)
      return
    }
    if (!players.every((p) => p.isReady)) {
      setError('Everyone must be ready to start.')
      return
    }

    const deck = buildRoleDeck(players.length)
    const updates: Record<string, unknown> = {
      status: 'night',
      dayCount: 1,
      updatedAt: Date.now(),
      phaseEndsAt: Date.now() + phaseDurations.night * 1000,
      votes: deleteField(),
      nightActions: deleteField(),
      lastNight: deleteField(),
      lastEliminated: deleteField(),
      hunterPending: deleteField(),
      winner: deleteField(),
      winReason: deleteField(),
      chat: deleteField(),
    }

    players.forEach((player, index) => {
      updates[`players.${player.id}.role`] = deck[index]
      updates[`players.${player.id}.isAlive`] = true
      updates[`players.${player.id}.isReady`] = false
    })

    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const setVote = async (targetId: string) => {
    if (!room || !me) return
    const ref = doc(db, 'rooms', room.code)
    await updateDoc(ref, {
      [`votes.${playerId}`]: targetId,
      updatedAt: Date.now(),
    })
  }

  const setNightAction = async (update: Partial<NightActions>) => {
    if (!room || !me) return
    const ref = doc(db, 'rooms', room.code)
    const payload: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    Object.entries(update).forEach(([key, value]) => {
      payload[`nightActions.${key}`] = value
    })
    await updateDoc(ref, payload)
  }

  const advancePhase = async () => {
    if (!room || !isHost) return
    const players = Object.values(room.players)
    const next = nextPhase(room.status)
    const updates: Record<string, unknown> = {
      status: next,
      updatedAt: Date.now(),
      votes: deleteField(),
      phaseEndsAt:
        next !== 'lobby' && next !== 'results'
          ? Date.now() + phaseDurations[next as keyof typeof phaseDurations] * 1000
          : deleteField(),
    }

    const eliminated: string[] = []

    if (room.status === 'night') {
      const result = resolveNight(players, room.nightActions)
      if (result.killedId) {
        updates[`players.${result.killedId}.isAlive`] = false
        eliminated.push(result.killedId)
      }
      updates.lastNight = result
      updates.nightActions = deleteField()
    }

    if (room.status === 'voting') {
      const voteResult = computeVoteResult(room.votes)
      if (voteResult?.targetId) {
        updates[`players.${voteResult.targetId}.isAlive`] = false
        updates.lastEliminated = [voteResult.targetId]
        eliminated.push(voteResult.targetId)
      } else {
        updates.lastEliminated = []
      }
    }

    const hunterEliminated = eliminated.find((id) => {
      const player = players.find((p) => p.id === id)
      return player?.role === 'hunter'
    })

    if (hunterEliminated) {
      updates.hunterPending = hunterEliminated
    }

    const aliveAfter = players.map((player) =>
      eliminated.includes(player.id) ? { ...player, isAlive: false } : player
    )
    const winner = computeWinner(aliveAfter)

    if (winner && !hunterEliminated) {
      updates.status = 'results'
      updates.phaseEndsAt = deleteField()
      updates.winner = winner.winner
      updates.winReason = winner.reason
    } else if (next === 'night') {
      updates.dayCount = (room.dayCount || 1) + 1
    }

    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const resetLobby = async () => {
    if (!room || !isHost) return
    const updates: Record<string, unknown> = {
      status: 'lobby',
      updatedAt: Date.now(),
      phaseEndsAt: deleteField(),
      votes: deleteField(),
      nightActions: deleteField(),
      lastNight: deleteField(),
      lastEliminated: deleteField(),
      hunterPending: deleteField(),
      winner: deleteField(),
      winReason: deleteField(),
    }
    Object.values(room.players).forEach((player) => {
      updates[`players.${player.id}.isReady`] = false
      updates[`players.${player.id}.role`] = deleteField()
      updates[`players.${player.id}.isAlive`] = true
    })
    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const leaveRoom = async () => {
    if (!room) return
    const ref = doc(db, 'rooms', room.code)
    const players = Object.values(room.players).filter((p) => p.id !== playerId)

    const updates: Record<string, unknown> = {
      [`players.${playerId}`]: deleteField(),
      updatedAt: Date.now(),
    }

    if (isHost && players.length > 0) {
      const nextHost = players[0]
      updates.hostId = nextHost.id
      updates[`players.${nextHost.id}.isHost`] = true
    }

    await updateDoc(ref, updates)
    setActiveCode('')
    setRoom(null)
  }

  const rejoinRoom = async () => {
    if (!room) return
    const name = playerName.trim() || getStoredName().trim()
    if (!name) {
      setError('Enter your name to rejoin.')
      return
    }
    storeName(name)
    await setDoc(
      doc(db, 'rooms', room.code),
      {
        updatedAt: Date.now(),
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: room.hostId === playerId,
          isAlive: true,
          isReady: false,
          joinedAt: Date.now(),
        },
      },
      { merge: true }
    )
  }

  const sendChat = async (message: string) => {
    if (!room || !me) return
    if (!me.isAlive) {
      setError('Eliminated players cannot chat.')
      return
    }
    if (room.status === 'night' && me.role !== 'werewolf') {
      setError('Only werewolves can chat at night.')
      return
    }
    const trimmed = message.trim()
    if (!trimmed) return
    await updateDoc(doc(db, 'rooms', room.code), {
      chat: arrayUnion({
        id: crypto.randomUUID(),
        senderId: playerId,
        senderName: me.name,
        message: trimmed,
        audience: room.status === 'night' ? 'werewolves' : 'all',
        createdAt: Date.now(),
      }),
      updatedAt: Date.now(),
    })
  }

  const sendHunterShot = async (targetId: string) => {
    if (!room || !me) return
    if (!room.hunterPending || room.hunterPending !== playerId) return
    if (!targetId) return
    const target = room.players[targetId]
    if (!target || !target.isAlive) return

    const players = Object.values(room.players)
    const eliminated = [targetId]
    const aliveAfter = players.map((player) =>
      eliminated.includes(player.id) ? { ...player, isAlive: false } : player
    )
    const winner = computeWinner(aliveAfter)

    const updates: Record<string, unknown> = {
      [`players.${targetId}.isAlive`]: false,
      hunterPending: deleteField(),
      lastEliminated: [...(room.lastEliminated ?? []), targetId],
      updatedAt: Date.now(),
    }

    if (winner) {
      updates.status = 'results'
      updates.phaseEndsAt = deleteField()
      updates.winner = winner.winner
      updates.winReason = winner.reason
    }

    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const countdown = room?.phaseEndsAt ? Math.max(0, Math.ceil((room.phaseEndsAt - now) / 1000)) : null

  const value: RoomState = {
    playerId,
    playerName,
    setPlayerName,
    roomCode,
    setRoomCode,
    activeCode,
    setActiveCode,
    room,
    status,
    error,
    loading,
    me,
    isHost,
    rolesPalette,
    phaseLabels,
    minPlayers,
    countdown,
    createRoom,
    joinRoom,
    leaveRoom,
    rejoinRoom,
    toggleReady,
    startGame,
    advancePhase,
    resetLobby,
    setVote,
    setNightAction,
    sendChat,
    sendHunterShot,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider')
  }
  return context
}

export { rolesPalette, phaseLabels, minPlayers, phaseDurations }
