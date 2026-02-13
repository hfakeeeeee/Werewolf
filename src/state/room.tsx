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
import type {
  GameMode,
  NightActions,
  NightResult,
  Phase,
  Player,
  Role,
  RoleCounts,
  Room,
  WitchState,
} from '../lib/types'

const rolesPalette: Role[] = [
  'werewolf',
  'seer',
  'bodyguard',
  'witch',
  'hunter',
  'fool',
  'detective',
  'silencer',
  'cupid',
  'villager',
]
const minPlayers = 4
const customRoleOrder: Role[] = [
  'werewolf',
  'seer',
  'bodyguard',
  'witch',
  'hunter',
  'fool',
  'detective',
  'silencer',
  'cupid',
  'villager',
]
const defaultCustomRoles: RoleCounts = {
  werewolf: 1,
  seer: 1,
  bodyguard: 1,
  witch: 0,
  hunter: 0,
  fool: 0,
  detective: 0,
  silencer: 0,
  cupid: 0,
  villager: 1,
}

const phaseLabels: Record<Phase, string> = {
  lobby: 'Lobby',
  night: 'Night',
  day: 'Day',
  voting: 'Voting',
  final: 'Final Plea',
  results: 'Results',
}

const phaseDurations: Record<Exclude<Phase, 'lobby' | 'results'>, number> = {
  night: 45,
  day: 120,
  voting: 45,
  final: 30,
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
  if (count >= 6) deck.push('bodyguard')
  if (count >= 7) deck.push('hunter')
  if (count >= 8) deck.push('witch')
  if (count >= 9) deck.push('fool')
  if (count >= 10) deck.push('detective')
  if (count >= 11) deck.push('silencer')
  if (count >= 12) deck.push('cupid')
  while (deck.length < count) deck.push('villager')
  return shuffle(deck)
}

function getCustomRoleCounts(room: Room | null): RoleCounts {
  const raw = room?.customRoles ?? {}
  return customRoleOrder.reduce((acc, role) => {
    const value = raw[role]
    const safe = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    acc[role] = safe
    return acc
  }, {} as RoleCounts)
}

function buildCustomRoleDeck(playersCount: number, counts: RoleCounts): { deck: Role[] | null; error?: string } {
  const total = customRoleOrder.reduce((sum, role) => sum + (counts[role] ?? 0), 0)
  if (total !== playersCount) {
    return { deck: null, error: `Custom roles must total ${playersCount}. Current total is ${total}.` }
  }
  if ((counts.werewolf ?? 0) < 1) {
    return { deck: null, error: 'Custom roles must include at least one werewolf.' }
  }

  const deck: Role[] = []
  customRoleOrder.forEach((role) => {
    const count = counts[role] ?? 0
    for (let i = 0; i < count; i += 1) {
      deck.push(role)
    }
  })
  return { deck: shuffle(deck) }
}

function isWerewolfTeam(role: Role | undefined) {
  return role === 'werewolf'
}

function sameTeam(a: Role | undefined, b: Role | undefined) {
  return isWerewolfTeam(a) === isWerewolfTeam(b)
}

function nextPhase(current: Phase): Phase {
  switch (current) {
    case 'night':
      return 'day'
    case 'day':
      return 'voting'
    case 'voting':
      return 'final'
    case 'final':
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

function resolveMainNight(
  players: Player[],
  nightActions: NightActions | undefined
): {
  pendingVictimId?: string
  bodyguardSavedId?: string
  seerResult?: { targetId: string; role: Role }
  detectiveResult?: { targetIds: [string, string]; sameTeam: boolean }
} {
  if (!nightActions) return {}
  const killedId = nightActions.werewolfTarget
  const savedId = nightActions.bodyguardProtect
  const pendingVictimId = killedId && killedId !== savedId ? killedId : undefined
  const seerTarget = nightActions.seerInspect
  const seerPlayer = players.find((p) => p.id === seerTarget)
  const detectiveTargetA = nightActions.detectiveTargetA
  const detectiveTargetB = nightActions.detectiveTargetB
  const detectivePlayerA = players.find((p) => p.id === detectiveTargetA)
  const detectivePlayerB = players.find((p) => p.id === detectiveTargetB)
  const result: {
    pendingVictimId?: string
    bodyguardSavedId?: string
    seerResult?: { targetId: string; role: Role }
    detectiveResult?: { targetIds: [string, string]; sameTeam: boolean }
  } = {}

  if (pendingVictimId) result.pendingVictimId = pendingVictimId
  if (savedId) result.bodyguardSavedId = savedId
  if (seerPlayer) {
    result.seerResult = {
      targetId: seerPlayer.id,
      role: seerPlayer.role ?? 'villager',
    }
  }
  if (detectivePlayerA && detectivePlayerB) {
    result.detectiveResult = {
      targetIds: [detectivePlayerA.id, detectivePlayerB.id],
      sameTeam: sameTeam(detectivePlayerA.role, detectivePlayerB.role),
    }
  }

  return result
}

function resolveFinalNight(
  players: Player[],
  nightActions: NightActions | undefined,
  witchState: WitchState | undefined,
  pendingVictimId: string | undefined
): NightResult {
  const mainResult = resolveMainNight(players, nightActions)
  const killSet = new Set<string>()
  const result: NightResult = {}

  const action = nightActions?.witchHeal
    ? 'heal'
    : nightActions?.witchPoisonTarget
      ? 'poison'
      : 'pass'
  const poisonTargetId = nightActions?.witchPoisonTarget

  const effectivePendingVictim = mainResult.pendingVictimId ?? pendingVictimId
  const canHeal = Boolean(!witchState?.healUsed && action === 'heal' && effectivePendingVictim)
  const canPoison = Boolean(!witchState?.poisonUsed && action === 'poison' && poisonTargetId)

  if (mainResult.bodyguardSavedId) result.bodyguardSavedId = mainResult.bodyguardSavedId
  if (mainResult.seerResult) result.seerResult = mainResult.seerResult
  if (mainResult.detectiveResult) result.detectiveResult = mainResult.detectiveResult

  if (effectivePendingVictim && !canHeal) {
    killSet.add(effectivePendingVictim)
  }
  if (canHeal && effectivePendingVictim) {
    result.witchSavedId = effectivePendingVictim
  }
  if (canPoison && poisonTargetId) {
    killSet.add(poisonTargetId)
    result.witchPoisonedId = poisonTargetId
  }

  const killedIds = Array.from(killSet)
  if (killedIds.length > 0) {
    result.killedIds = killedIds
    result.killedId = killedIds[0]
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

function applyLoverDeaths(killedIds: string[], lovers: string[] | undefined) {
  if (!lovers || lovers.length !== 2) return killedIds
  const [loverA, loverB] = lovers
  const killedSet = new Set(killedIds)
  if (killedSet.has(loverA) && !killedSet.has(loverB)) killedSet.add(loverB)
  if (killedSet.has(loverB) && !killedSet.has(loverA)) killedSet.add(loverA)
  return Array.from(killedSet)
}

export interface RoomState {
  playerId: string
  playerName: string
  setPlayerName: (name: string) => void
  roomCode: string
  setRoomCode: (code: string) => void
  activeCode: string
  setActiveCode: (code: string) => void
  updatePlayerName: (name: string) => Promise<void>
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
  setGameMode: (mode: GameMode) => Promise<void>
  setCustomRoleCount: (role: Role, count: number) => Promise<void>
  createRoom: () => Promise<string | null>
  joinRoom: () => Promise<string | null>
  leaveRoom: () => Promise<void>
  rejoinRoom: () => Promise<void>
  toggleReady: () => Promise<void>
  startGame: () => Promise<void>
  advancePhase: () => Promise<void>
  resetLobby: () => Promise<void>
  setVote: (targetId: string) => Promise<void>
  setFinalVote: (vote: 'save' | 'kill') => Promise<void>
  setNightAction: (update: Partial<NightActions>) => Promise<void>
  setWitchAction: (action: 'heal' | 'poison' | 'pass', targetId?: string) => Promise<void>
  setCupidAction: (targetIds: string[]) => Promise<void>
  sendChat: (message: string) => Promise<void>
  sendHunterShot: (targetId: string) => Promise<void>
  removePlayer: (targetId: string) => Promise<void>
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

    if (!room.phaseEndsAt) {
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

  const setGameMode = async (mode: GameMode) => {
    if (!room || !isHost) return
    if (room.status !== 'lobby') return
    await updateDoc(doc(db, 'rooms', room.code), {
      gameMode: mode,
      updatedAt: Date.now(),
    })
  }

  const setCustomRoleCount = async (role: Role, count: number) => {
    if (!room || !isHost) return
    if (room.status !== 'lobby') return
    const clamped = Math.max(0, Math.min(16, Math.floor(count)))
    await updateDoc(doc(db, 'rooms', room.code), {
      [`customRoles.${role}`]: clamped,
      updatedAt: Date.now(),
    })
  }

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
      isSpectator: false,
      joinedAt: nowStamp,
    }

    const roomData: Room = {
      id: code,
      code,
      status: 'lobby',
      hostId: playerId,
      gameMode: 'classic',
      customRoles: { ...defaultCustomRoles },
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
    const isSpectator = snap.data().status !== 'lobby'
    await setDoc(
      ref,
      {
        updatedAt: nowStamp,
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: false,
          isAlive: !isSpectator,
          isReady: false,
          isSpectator,
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

    const mode: GameMode = room.gameMode ?? 'classic'
    let deck: Role[] = []
    if (mode === 'custom') {
      const counts = getCustomRoleCounts(room)
      const custom = buildCustomRoleDeck(players.length, counts)
      if (!custom.deck) {
        setError(custom.error ?? 'Invalid custom role setup.')
        return
      }
      deck = custom.deck
    } else {
      deck = buildRoleDeck(players.length)
    }

    const updates: Record<string, unknown> = {
      status: 'night',
      nightStep: deck.includes('cupid') ? 'cupid' : 'main',
      dayCount: 1,
      updatedAt: Date.now(),
      phaseEndsAt: Date.now() + phaseDurations.night * 1000,
      votes: deleteField(),
      finalVotes: deleteField(),
      finalAccusedId: deleteField(),
      nightActions: deleteField(),
      bodyguardLastProtectedId: deleteField(),
      lovers: deleteField(),
      silencedPlayerId: deleteField(),
      silencedDayCount: deleteField(),
      witchState: {
        healUsed: false,
        poisonUsed: false,
      },
      witchTurn: deleteField(),
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
      updates[`players.${player.id}.isSpectator`] = false
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

  const updatePlayerName = async (name: string) => {
    const trimmed = name.trim()
    if (!room || !trimmed) return
    if (room.status !== 'lobby') return
    if (!room.players?.[playerId]) return
    storeName(trimmed)
    setPlayerName(trimmed)
    await updateDoc(doc(db, 'rooms', room.code), {
      [`players.${playerId}.name`]: trimmed,
      updatedAt: Date.now(),
    })
  }

  const setFinalVote = async (vote: 'save' | 'kill') => {
    if (!room || !me) return
    if (room.status !== 'final') return
    if (!me.isAlive) return
    if (room.finalAccusedId === playerId) return
    await updateDoc(doc(db, 'rooms', room.code), {
      [`finalVotes.${playerId}`]: vote,
      updatedAt: Date.now(),
    })
  }

  const setNightAction = async (update: Partial<NightActions>) => {
    if (!room || !me) return
    if (room.status !== 'night') return
    if (room.nightStep !== 'main') return
    if (!me.isAlive) return

    const allowedKeysByRole: Record<Role, (keyof NightActions)[]> = {
      werewolf: ['werewolfTarget'],
      bodyguard: ['bodyguardProtect'],
      seer: ['seerInspect'],
      witch: [],
      hunter: [],
      fool: [],
      detective: ['detectiveTargetA', 'detectiveTargetB'],
      silencer: ['silencerTarget'],
      cupid: [],
      villager: [],
    }

    const allowed = allowedKeysByRole[me.role ?? 'villager']
    const entries = Object.entries(update).filter(([key]) =>
      allowed.includes(key as keyof NightActions)
    )
    if (entries.length === 0) return

    const bodyguardTarget = entries.find(([key]) => key === 'bodyguardProtect')?.[1] as string | undefined
    if (bodyguardTarget && room.bodyguardLastProtectedId === bodyguardTarget) return
    const silencerTarget = entries.find(([key]) => key === 'silencerTarget')?.[1] as string | undefined
    if (silencerTarget && silencerTarget === playerId) return
    if (silencerTarget && !room.players[silencerTarget]?.isAlive) return

    const ref = doc(db, 'rooms', room.code)
    const payload: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    entries.forEach(([key, value]) => {
      payload[`nightActions.${key}`] = value
    })
    await updateDoc(ref, payload)
  }

  const setWitchAction = async (action: 'heal' | 'poison' | 'pass', targetId?: string) => {
    if (!room || !me) return
    if (room.status !== 'night' || room.nightStep !== 'witch') return
    if (!me.isAlive || me.role !== 'witch') return

    const witchState = room.witchState ?? { healUsed: false, poisonUsed: false }
    const pendingVictimId = room.witchTurn?.pendingVictimId

    const payload: Record<string, unknown> = {
      updatedAt: Date.now(),
      'nightActions.witchHeal': deleteField(),
      'nightActions.witchPoisonTarget': deleteField(),
    }

    if (action === 'heal') {
      if (witchState.healUsed || !pendingVictimId) return
      payload['nightActions.witchHeal'] = true
    } else if (action === 'poison') {
      if (witchState.poisonUsed || !targetId) return
      const target = room.players[targetId]
      if (!target?.isAlive) return
      payload['nightActions.witchPoisonTarget'] = targetId
    }

    await updateDoc(doc(db, 'rooms', room.code), payload)
  }

  const setCupidAction = async (targetIds: string[]) => {
    if (!room || !me) return
    if (room.status !== 'night' || room.nightStep !== 'cupid') return
    if (!me.isAlive || me.role !== 'cupid') return
    if (targetIds.length < 1 || targetIds.length > 2) return
    const [first, second] = targetIds
    if (!first) return
    if (second && first === second) return
    if (!room.players[first]) return
    if (second && !room.players[second]) return

    await updateDoc(doc(db, 'rooms', room.code), {
      'nightActions.cupidLoverIds': targetIds,
      updatedAt: Date.now(),
    })
  }

  const advancePhase = async () => {
    if (!room || !isHost) return
    const players = Object.values(room.players)
    const next = nextPhase(room.status)
    const updates: Record<string, unknown> = {
      status: next,
      updatedAt: Date.now(),
      votes: deleteField(),
      finalVotes: deleteField(),
      phaseEndsAt:
        next !== 'lobby' && next !== 'results'
          ? Date.now() + phaseDurations[next as keyof typeof phaseDurations] * 1000
          : deleteField(),
    }

    const eliminated: string[] = []

    if (room.status === 'night') {
      if (room.nightStep === 'cupid') {
        const lovers = room.nightActions?.cupidLoverIds
        if (!lovers || lovers.length !== 2) {
          updates.status = 'night'
          updates.phaseEndsAt = Date.now() + phaseDurations.night * 1000
          await updateDoc(doc(db, 'rooms', room.code), updates)
          return
        }
        updates.status = 'night'
        updates.lovers = lovers
        updates.nightActions = deleteField()
        updates.nightStep = 'main'
        updates.phaseEndsAt = Date.now() + phaseDurations.night * 1000
        await updateDoc(doc(db, 'rooms', room.code), updates)
        return
      }

      const mainResult = resolveMainNight(players, room.nightActions)
      const witch = players.find((player) => player.role === 'witch' && player.isAlive)
      const witchState = room.witchState ?? { healUsed: false, poisonUsed: false }
      const canWitchAct = witch && (!witchState.healUsed || !witchState.poisonUsed)
      const isWitchStep = room.nightStep === 'witch'

      if (!isWitchStep && canWitchAct) {
        updates.status = 'night'
        updates.nightStep = 'witch'
        updates.witchTurn = {
          pendingVictimId: mainResult.pendingVictimId,
          action: 'pass',
        }
        updates.phaseEndsAt = Date.now() + phaseDurations.night * 1000
        await updateDoc(doc(db, 'rooms', room.code), updates)
        return
      }

      const pendingVictimId = room.witchTurn?.pendingVictimId ?? mainResult.pendingVictimId
      const result = resolveFinalNight(players, room.nightActions, witchState, pendingVictimId)
      let killedIds = result.killedIds ?? (result.killedId ? [result.killedId] : [])
      killedIds = applyLoverDeaths(killedIds, room.lovers)
      if (killedIds.length > 0) {
        result.killedIds = killedIds
        result.killedId = killedIds[0]
      }
      killedIds.forEach((killedId) => {
        updates[`players.${killedId}.isAlive`] = false
        eliminated.push(killedId)
      })

      const consumedHeal = Boolean(
        room.nightActions?.witchHeal &&
          pendingVictimId &&
          !(room.witchState?.healUsed ?? false)
      )
      const consumedPoison = Boolean(
        room.nightActions?.witchPoisonTarget && !(room.witchState?.poisonUsed ?? false)
      )
      updates.witchState = {
        healUsed: Boolean((room.witchState?.healUsed ?? false) || consumedHeal),
        poisonUsed: Boolean((room.witchState?.poisonUsed ?? false) || consumedPoison),
      }
      if (room.nightActions?.bodyguardProtect) {
        updates.bodyguardLastProtectedId = room.nightActions.bodyguardProtect
      }

      updates.lastNight = result
      updates.nightActions = deleteField()
      updates.witchTurn = deleteField()
      updates.nightStep = 'main'

      if (room.nightActions?.silencerTarget) {
        updates.silencedPlayerId = room.nightActions.silencerTarget
        updates.silencedDayCount = room.dayCount || 1
      }
    }

    if (room.status === 'voting') {
      const voteResult = computeVoteResult(room.votes)
      if (voteResult?.targetId) {
        updates.status = 'final'
        updates.finalAccusedId = voteResult.targetId
        updates.finalAccusedVotes = voteResult.votes
        updates.phaseEndsAt = Date.now() + phaseDurations.final * 1000
      } else {
        updates.status = 'night'
        updates.finalAccusedId = deleteField()
        updates.finalVotes = deleteField()
        updates.finalAccusedVotes = deleteField()
      }
      await updateDoc(doc(db, 'rooms', room.code), updates)
      return
    }

    if (room.status === 'final') {
      const accusedId = room.finalAccusedId
      const votes = room.finalVotes ?? {}
      const killVotes = Object.values(votes).filter((v) => v === 'kill').length
      const saveVotes = Object.values(votes).filter((v) => v === 'save').length
      const shouldKill = killVotes > saveVotes
      if (accusedId && shouldKill) {
        const finalEliminated = applyLoverDeaths([accusedId], room.lovers)
        finalEliminated.forEach((id) => {
          updates[`players.${id}.isAlive`] = false
          eliminated.push(id)
        })
        updates.lastEliminated = finalEliminated
        const eliminatedPlayer = players.find((player) => player.id === accusedId)
        if (eliminatedPlayer?.role === 'fool') {
          updates.status = 'results'
          updates.phaseEndsAt = deleteField()
          updates.winner = 'fool'
          updates.winReason = 'The Fool was voted out and wins instantly.'
          await updateDoc(doc(db, 'rooms', room.code), updates)
          return
        }
      } else {
        updates.lastEliminated = []
      }
      updates.status = 'night'
      updates.finalAccusedId = deleteField()
      updates.finalVotes = deleteField()
      updates.finalAccusedVotes = deleteField()
    }

    if (room.status === 'day') {
      if (room.silencedDayCount && room.silencedDayCount === room.dayCount) {
        updates.silencedPlayerId = deleteField()
        updates.silencedDayCount = deleteField()
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
    } else if (updates.status === 'night') {
      updates.dayCount = (room.dayCount || 1) + 1
      updates.nightStep = 'main'
      updates.witchTurn = deleteField()
      updates.nightActions = deleteField()
    }

    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const resetLobby = async () => {
    if (!room || !isHost) return
    const updates: Record<string, unknown> = {
      status: 'lobby',
      updatedAt: Date.now(),
      phaseEndsAt: deleteField(),
      nightStep: deleteField(),
      bodyguardLastProtectedId: deleteField(),
      votes: deleteField(),
      nightActions: deleteField(),
      finalVotes: deleteField(),
      finalAccusedId: deleteField(),
      finalAccusedVotes: deleteField(),
      witchState: deleteField(),
      witchTurn: deleteField(),
      lastNight: deleteField(),
      lastEliminated: deleteField(),
      hunterPending: deleteField(),
      lovers: deleteField(),
      silencedPlayerId: deleteField(),
      silencedDayCount: deleteField(),
      winner: deleteField(),
      winReason: deleteField(),
    }
    Object.values(room.players).forEach((player) => {
      updates[`players.${player.id}.isReady`] = false
      updates[`players.${player.id}.role`] = deleteField()
      updates[`players.${player.id}.isAlive`] = true
      updates[`players.${player.id}.isSpectator`] = false
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
    const isSpectator = room.status !== 'lobby'
    await setDoc(
      doc(db, 'rooms', room.code),
      {
        updatedAt: Date.now(),
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: room.hostId === playerId,
          isAlive: !isSpectator,
          isReady: false,
          isSpectator,
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
    if (
      (room.status === 'day' || room.status === 'final') &&
      room.silencedPlayerId === playerId &&
      room.silencedDayCount === room.dayCount
    ) {
      setError('You are silenced for today.')
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

  const removePlayer = async (targetId: string) => {
    if (!room) return
    if (!room.players?.[playerId]?.isHost) return
    if (!room.players?.[targetId]) return
    if (targetId === playerId) return
    const updates: Record<string, unknown> = {
      [`players.${targetId}`]: deleteField(),
      updatedAt: Date.now(),
    }
    if (room.hostId === targetId) {
      updates.hostId = playerId
      updates[`players.${playerId}.isHost`] = true
    }
    await updateDoc(doc(db, 'rooms', room.code), updates)
  }

  const sendHunterShot = async (targetId: string) => {
    if (!room || !me) return
    if (!room.hunterPending || room.hunterPending !== playerId) return
    if (!targetId) return
    const target = room.players[targetId]
    if (!target || !target.isAlive) return

    const players = Object.values(room.players)
    const eliminated = applyLoverDeaths([targetId], room.lovers)
    const aliveAfter = players.map((player) =>
      eliminated.includes(player.id) ? { ...player, isAlive: false } : player
    )
    const winner = computeWinner(aliveAfter)

    const updates: Record<string, unknown> = {
      hunterPending: deleteField(),
      lastEliminated: [...(room.lastEliminated ?? []), ...eliminated],
      updatedAt: Date.now(),
    }
    eliminated.forEach((id) => {
      updates[`players.${id}.isAlive`] = false
    })

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
    updatePlayerName,
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
    setGameMode,
    setCustomRoleCount,
    createRoom,
    joinRoom,
    leaveRoom,
    rejoinRoom,
    toggleReady,
    startGame,
    advancePhase,
    resetLobby,
    setVote,
    setFinalVote,
    setNightAction,
    setWitchAction,
    setCupidAction,
    sendChat,
    sendHunterShot,
    removePlayer,
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

export { rolesPalette, phaseLabels, minPlayers, phaseDurations, customRoleOrder, defaultCustomRoles }
