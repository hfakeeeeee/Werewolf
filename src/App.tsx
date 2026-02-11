import { useEffect, useMemo, useState } from 'react'
import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './lib/firebase'
import type { Phase, Player, Role, Room } from './lib/types'

const rolesPalette: Role[] = ['werewolf', 'seer', 'doctor', 'hunter', 'villager']
const minPlayers = 4

const phaseLabels: Record<Phase, string> = {
  lobby: 'Lobby',
  night: 'Night',
  day: 'Day',
  voting: 'Voting',
  results: 'Results',
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
  const deck: Role[] = ['werewolf']
  if (count >= 5) deck.push('seer')
  if (count >= 6) deck.push('doctor')
  if (count >= 7) deck.push('hunter')
  while (deck.length < count) deck.push('villager')
  return shuffle(deck)
}

export default function App() {
  const playerId = useMemo(() => getPlayerId(), [])
  const [playerName, setPlayerName] = useState(getStoredName())
  const [roomCode, setRoomCode] = useState('')
  const [activeCode, setActiveCode] = useState('')
  const [room, setRoom] = useState<Room | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rejoining, setRejoining] = useState(false)

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

  const me = room?.players?.[playerId]
  const isHost = me?.isHost

  const createRoom = async () => {
    const name = playerName.trim()
    if (!name) {
      setError('Please enter a name.')
      return
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
      return
    }

    const now = Date.now()
    const player: Player = {
      id: playerId,
      name,
      isHost: true,
      isAlive: true,
      isReady: false,
      joinedAt: now,
    }

    const roomData: Room = {
      id: code,
      code,
      status: 'lobby',
      hostId: playerId,
      createdAt: now,
      updatedAt: now,
      players: { [playerId]: player },
      dayCount: 0,
    }

    await setDoc(doc(db, 'rooms', code), roomData)
    setActiveCode(code)
    setRoomCode(code)
    setStatus('')
    setLoading(false)
  }

  const joinRoom = async () => {
    const name = playerName.trim()
    const code = roomCode.trim().toUpperCase()
    if (!name) {
      setError('Please enter a name.')
      return
    }
    if (!code) {
      setError('Enter a room code.')
      return
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
      return
    }

    const now = Date.now()
    await setDoc(
      ref,
      {
        updatedAt: now,
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: false,
          isAlive: true,
          isReady: false,
          joinedAt: now,
        },
      },
      { merge: true }
    )

    setActiveCode(code)
    setRoomCode(code)
    setStatus('')
    setLoading(false)
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
    }

    players.forEach((player, index) => {
      updates[`players.${player.id}.role`] = deck[index]
      updates[`players.${player.id}.isAlive`] = true
      updates[`players.${player.id}.isReady`] = false
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

  return (
    <div className="min-h-screen bg-ashen text-slate-100">
      <div className="relative overflow-hidden">
        <div className="hero-glow" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ember" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-ashen-400">Werewolf Online</p>
                <h1 className="font-display text-2xl">Night Council</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                Firebase MVP
              </span>
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                Free Tier Ready
              </span>
            </div>
          </header>

          <main className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-ashen-600 bg-ashen-800/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-ashen-200">
                Live Room Control
              </div>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Gather your friends. Start a room. Survive the night.
              </h2>
              <p className="text-base text-ashen-200 md:text-lg">
                Firebase-only MVP with Firestore listeners. Create a room, invite friends, and play live
                with instant sync.
              </p>

              <div className="grid gap-4 rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-ashen-400">Your name</label>
                  <input
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="Enter a nickname"
                    className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-3 text-sm text-ashen-100 outline-none focus:border-ember"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-ashen-400">Room code</label>
                  <input
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    placeholder="ABCDE"
                    className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-3 text-sm text-ashen-100 outline-none focus:border-ember"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={createRoom}
                    disabled={loading}
                    className="rounded-lg bg-ember px-5 py-3 text-sm font-semibold text-slate-950 shadow-ember disabled:opacity-60"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={joinRoom}
                    disabled={loading}
                    className="rounded-lg border border-ashen-500 px-5 py-3 text-sm font-semibold text-ashen-100 disabled:opacity-60"
                  >
                    Join Room
                  </button>
                  {room && (
                    <button
                      onClick={leaveRoom}
                      className="rounded-lg border border-ashen-500 px-5 py-3 text-sm font-semibold text-ashen-100"
                    >
                      Leave
                    </button>
                  )}
                </div>
                {status && <p className="text-sm text-ashen-300">{status}</p>}
                {error && <p className="text-sm text-ember">{error}</p>}
              </div>

              {room && (
                <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Room</p>
                      <h3 className="font-display text-2xl">{room.code}</h3>
                    </div>
                    <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                      {phaseLabels[room.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.values(room.players).map((player) => (
                      <span
                        key={player.id}
                        className={`rounded-full px-3 py-1 text-xs ${
                          player.isHost
                            ? 'bg-ember text-slate-950'
                            : player.isReady
                              ? 'bg-ashen-700/90 text-ashen-100'
                              : 'bg-ashen-700/50 text-ashen-200'
                        }`}
                      >
                        {player.name}
                        {player.isHost ? ' (Host)' : ''}
                        {player.id === playerId ? ' • You' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {me ? (
                      <button
                        onClick={toggleReady}
                        className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
                      >
                        {me.isReady ? 'Unready' : 'Ready'}
                      </button>
                    ) : (
                      <button
                        onClick={rejoinRoom}
                        className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
                      >
                        Rejoin Room
                      </button>
                    )}
                    {isHost && (
                      <button
                        onClick={startGame}
                        className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Start Game
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6 shadow-inky">
              <h3 className="font-display text-xl">Room Preview</h3>
              <div className="mt-4 grid gap-4">
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Roles in this build</p>
                  <ul className="mt-2 grid gap-2 text-sm text-ashen-100">
                    {rolesPalette.map((role) => (
                      <li key={role} className="flex items-center justify-between">
                        <span>{role}</span>
                        <span className="text-ashen-400">Active</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Phase</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-2xl">
                      {room ? phaseLabels[room.status] : 'Lobby'}
                    </span>
                    <span className="rounded-full bg-ashen-700/80 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                      {room ? `Day ${room.dayCount || 1}` : 'Waiting'}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ashen-700">
                    <div className="h-full w-3/4 bg-ember" />
                  </div>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Ready check</p>
                  <p className="mt-2 text-sm text-ashen-200">
                    {room
                      ? `${Object.values(room.players).filter((p) => p.isReady).length} ready / ${
                          Object.keys(room.players).length
                        } total`
                      : 'Waiting for players'}
                  </p>
                </div>
              </div>
            </aside>
          </main>

          <section className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Create / Join Rooms',
                text: 'Invite friends with a short code and sync instantly with Firestore listeners.',
              },
              {
                title: 'Day / Night Engine',
                text: 'Serverless state machine. Host assigns roles and starts the night.',
              },
              {
                title: 'Next Up',
                text: 'Chat, voting UI, and phase timers synced for everyone.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <h4 className="font-display text-lg">{card.title}</h4>
                <p className="mt-2 text-sm text-ashen-200">{card.text}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
