import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { customRoleOrder, defaultCustomRoles, useRoom } from '../state/room'
import type { Role } from '../lib/types'

const roleHints: Record<Role, string> = {
  werewolf: 'Coordinate with other werewolves and strike together.',
  seer: 'Inspect a player each night to learn their role.',
  bodyguard: 'Protect one player each night, but not the same player on consecutive nights.',
  witch: 'Act after others. Heal the pending victim or poison someone once each.',
  hunter: 'If you fall, pick one player to take down with you.',
  villager: 'Discuss, deduce, and vote to eliminate werewolves.',
}

const roleIcons: Record<Role, string> = {
  werewolf: '🐺',
  seer: '🔮',
  bodyguard: '🛡',
  witch: '🧪',
  hunter: '🏹',
  villager: '🧑‍🌾',
}

const skinTones = ['#F7D7C4', '#E9C4A3', '#D8A57E', '#B98364', '#8D5E3C', '#7C4A2B']
const hairColors = ['#1F2937', '#4B2E2A', '#A16207', '#6B7280', '#111827', '#3F2E1E']
const shirtColors = ['#22D3EE', '#F97316', '#A78BFA', '#10B981', '#F43F5E', '#38BDF8']
const accessories = ['none', 'glasses', 'hat', 'scar', 'earring', 'headband']
const eyeStyles = ['round', 'sleepy', 'wink', 'focused']
const mouthStyles = ['smile', 'smirk', 'neutral', 'open']
const hairStyles = ['short', 'swoop', 'curly', 'spiky']
const shirtStyles = ['hoodie', 'tee', 'collar']

function pickFrom<T>(arr: T[], seed: number) {
  return arr[seed % arr.length]
}

function avatarSeed(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 10000
  }
  return hash
}

function Avatar({ seed, sizeClass = 'h-14 w-14' }: { seed: number; sizeClass?: string }) {
  const skin = pickFrom(skinTones, seed)
  const hair = pickFrom(hairColors, seed + 3)
  const shirt = pickFrom(shirtColors, seed + 7)
  const accessory = pickFrom(accessories, seed + 11)
  const eyeStyle = pickFrom(eyeStyles, seed + 13)
  const mouthStyle = pickFrom(mouthStyles, seed + 17)
  const hairStyle = pickFrom(hairStyles, seed + 19)
  const shirtStyle = pickFrom(shirtStyles, seed + 23)
  const hasGlasses = accessory === 'glasses'
  const hasHat = accessory === 'hat'
  const hasScar = accessory === 'scar'
  const hasEarring = accessory === 'earring'
  const hasHeadband = accessory === 'headband'

  return (
    <svg viewBox="0 0 140 140" className={sizeClass} aria-hidden="true">
      <rect x="0" y="0" width="140" height="140" fill="none" />
      <circle cx="70" cy="56" r="26" fill={skin} />
      <path d="M28 132c6-28 26-42 42-42h0c16 0 36 14 42 42" fill={shirt} />
      {hairStyle === 'short' && (
        <path d="M42 50c6-12 16-18 28-18 12 0 22 6 28 18" fill={hair} />
      )}
      {hairStyle === 'swoop' && (
        <path d="M36 54c8-18 24-26 40-26 12 0 22 6 28 14" fill={hair} />
      )}
      {hairStyle === 'curly' && (
        <path d="M40 54c6-14 18-20 30-20 12 0 22 6 30 20" fill={hair} />
      )}
      {hairStyle === 'spiky' && (
        <path d="M42 54l10-16 10 10 8-12 8 12 8-10 12 16" fill={hair} />
      )}
      <path d="M42 62c4 14 16 24 28 24s24-10 28-24" fill="none" />
      {hasHat && (
        <>
          <rect x="36" y="28" width="68" height="10" fill="#0F172A" />
          <rect x="50" y="14" width="40" height="18" rx="4" fill="#0F172A" />
        </>
      )}
      {hasGlasses && (
        <>
          <rect x="44" y="52" width="20" height="12" rx="3" fill="#111827" />
          <rect x="76" y="52" width="20" height="12" rx="3" fill="#111827" />
          <rect x="64" y="56" width="12" height="2" fill="#111827" />
        </>
      )}
      {hasHeadband && <rect x="38" y="44" width="64" height="8" rx="4" fill="#F97316" />}
      {hasScar && <rect x="78" y="46" width="18" height="3" rx="1.5" fill="#9CA3AF" />}
      {hasEarring && <circle cx="96" cy="70" r="4" fill="#FBBF24" />}
      {eyeStyle === 'round' && (
        <>
          <circle cx="60" cy="60" r="3" fill="#1F2937" />
          <circle cx="80" cy="60" r="3" fill="#1F2937" />
        </>
      )}
      {eyeStyle === 'sleepy' && (
        <>
          <rect x="56" y="60" width="8" height="2" rx="1" fill="#1F2937" />
          <rect x="76" y="60" width="8" height="2" rx="1" fill="#1F2937" />
        </>
      )}
      {eyeStyle === 'wink' && (
        <>
          <circle cx="60" cy="60" r="3" fill="#1F2937" />
          <rect x="76" y="60" width="8" height="2" rx="1" fill="#1F2937" />
        </>
      )}
      {eyeStyle === 'focused' && (
        <>
          <circle cx="60" cy="60" r="3" fill="#1F2937" />
          <circle cx="80" cy="60" r="3" fill="#1F2937" />
          <path d="M54 54h12" stroke="#1F2937" strokeWidth="2" />
          <path d="M74 54h12" stroke="#1F2937" strokeWidth="2" />
        </>
      )}
      {mouthStyle === 'smile' && (
        <path d="M60 74c6 6 14 6 20 0" stroke="#1F2937" strokeWidth="3" fill="none" />
      )}
      {mouthStyle === 'smirk' && (
        <path d="M62 74c6 3 12 3 18 0" stroke="#1F2937" strokeWidth="3" fill="none" />
      )}
      {mouthStyle === 'neutral' && (
        <path d="M62 74h18" stroke="#1F2937" strokeWidth="3" fill="none" />
      )}
      {mouthStyle === 'open' && <circle cx="70" cy="76" r="5" fill="#1F2937" />}
      {shirtStyle === 'hoodie' && (
        <path d="M38 132c6-20 22-32 32-32h0c10 0 26 12 32 32" fill={shirt} />
      )}
      {shirtStyle === 'tee' && (
        <path d="M32 132c10-26 24-36 38-36h0c14 0 28 10 38 36" fill={shirt} />
      )}
      {shirtStyle === 'collar' && (
        <>
          <path d="M28 132c6-28 26-42 42-42h0c16 0 36 14 42 42" fill={shirt} />
          <path d="M60 90l10 12 10-12" fill="#F8FAFC" opacity="0.8" />
        </>
      )}
    </svg>
  )
}

export default function GamePage() {
  const navigate = useNavigate()
  const { code } = useParams()
  const [message, setMessage] = useState('')
  const [showRoleWheel, setShowRoleWheel] = useState(false)
  const [roleRevealed, setRoleRevealed] = useState(false)
  const {
    playerId,
    setActiveCode,
    room,
    error,
    me,
    isHost,
    countdown,
    phaseLabels,
    setGameMode,
    setCustomRoleCount,
    toggleReady,
    rejoinRoom,
    leaveRoom,
    startGame,
    advancePhase,
    resetLobby,
    setVote,
    setNightAction,
    setWitchAction,
    sendChat,
    sendHunterShot,
    removePlayer,
  } = useRoom()

  useEffect(() => {
    if (!code) return
    setActiveCode(code)
  }, [code, setActiveCode])

  useEffect(() => {
    if (!room || room.status === 'lobby') {
      setShowRoleWheel(false)
      setRoleRevealed(false)
      return
    }
    if (!me?.role) return
    if (roleRevealed || showRoleWheel) return
    setShowRoleWheel(true)
  }, [me?.role, roleRevealed, room, showRoleWheel])

  useEffect(() => {
    if (!showRoleWheel) return
    const timer = setTimeout(() => {
      setShowRoleWheel(false)
      setRoleRevealed(true)
    }, 2600)
    return () => clearTimeout(timer)
  }, [showRoleWheel])

  const orderedPlayers = useMemo(() => {
    if (!room) return []
    return Object.values(room.players).sort((a, b) => {
      if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt
      return a.id.localeCompare(b.id)
    })
  }, [room])

  const alivePlayers = useMemo(
    () => orderedPlayers.filter((p) => p.isAlive),
    [orderedPlayers]
  )
  const gameMode = room?.gameMode ?? 'classic'
  const customRoles = useMemo(() => {
    if (!room) return { ...defaultCustomRoles }
    return customRoleOrder.reduce((acc, role) => {
      const value = room.customRoles?.[role]
      acc[role] = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
      return acc
    }, {} as Record<Role, number>)
  }, [room])
  const customTotal = customRoleOrder.reduce((sum, role) => sum + (customRoles[role] ?? 0), 0)
  const customHasWerewolf = (customRoles.werewolf ?? 0) > 0
  const customMatchesPlayers = customTotal === orderedPlayers.length
  const canStartWithCurrentSetup = gameMode === 'classic' || (customHasWerewolf && customMatchesPlayers)

  const myVote = room?.votes?.[playerId]
  const nightActions = room?.nightActions
  const lastNight = room?.lastNight
  const isNight = room?.status === 'night'
  const isNightMainStep = room?.nightStep !== 'witch'
  const isWitchStep = room?.status === 'night' && room?.nightStep === 'witch'
  const nightVictimName = room?.witchTurn?.pendingVictimId
    ? room.players[room.witchTurn.pendingVictimId]?.name ?? 'Unknown'
    : null
  const isWerewolf = me?.role === 'werewolf'
  const canChat = Boolean(me?.isAlive && (!isNight || isWerewolf))
  const canHunterShoot = room?.hunterPending === playerId
  const waitingForHunter = Boolean(room?.hunterPending && !canHunterShoot)
  const canWitchAct = Boolean(isWitchStep && me?.isAlive && me.role === 'witch')
  const visibleMessages = room?.chat?.filter(
    (msg) => (msg.audience ?? 'all') === 'all' || isWerewolf
  )

  const handleSend = async () => {
    await sendChat(message)
    setMessage('')
  }

  const goBack = async () => {
    await leaveRoom()
    navigate('/')
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-ashen text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="font-display text-2xl">Room not found</h2>
          <p className="mt-2 text-ashen-200">Create a new room or check the code.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ashen text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="parallax-layer parallax-slow" />
          <div className="parallax-layer parallax-fast" />
        </div>
        <div className="hero-glow" />
        <div className="relative z-10 mx-auto px-5 py-6 lg:h-full">
          {showRoleWheel && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-ashen/90 px-6">
              <div className="w-full max-w-md rounded-2xl border border-ashen-700 bg-ashen-900/90 p-8 text-center shadow-inky">
                <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Role Draw</p>
                <h2 className="mt-3 font-display text-2xl">Spinning the wheel...</h2>
                <div className="mt-6 grid place-items-center">
                  <div className="role-wheel" />
                </div>
                <p className="mt-4 text-sm text-ashen-300">Your role is being revealed.</p>
              </div>
            </div>
          )}
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ember text-lg font-semibold text-slate-950">
                W
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-ashen-400">Werewolf Online</p>
                <h1 className="font-display text-2xl">Room {room.code}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                {phaseLabels[room.status]}
              </span>
              {isWitchStep && (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  Witch Turn
                </span>
              )}
              {countdown !== null && room.status !== 'lobby' && room.status !== 'results' && (
                <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                  {countdown}s left
                </span>
              )}
              {isHost && room.status !== 'results' && (
                <button
                  onClick={advancePhase}
                  className="rounded-lg bg-ember px-3 py-2 text-xs font-semibold text-slate-950"
                >
                  Advance Phase
                </button>
              )}
              {isHost && (
                <button
                  onClick={resetLobby}
                  className="rounded-lg border border-ashen-500 px-3 py-2 text-xs font-semibold text-ashen-100"
                >
                  Reset to Lobby
                </button>
              )}
              <button
                onClick={goBack}
                className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
              >
                Leave Room
              </button>
            </div>
          </header>

          <main className="mt-4 grid gap-4 lg:h-[calc(100vh-120px)] lg:grid-cols-[1.25fr_0.75fr] lg:overflow-hidden">
            <section className="space-y-4 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-3 lg:flex lg:h-full lg:flex-col">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Players</p>
                    <h3 className="font-display text-xl">Village Roster</h3>
                  </div>
                  <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                    {alivePlayers.length} alive / {orderedPlayers.length} total
                  </span>
                </div>
                <div className="mt-2 grid flex-1 auto-rows-fr gap-2 overflow-hidden sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 16 }).map((_, index) => {
                    const player = orderedPlayers[index]
                    if (!player) {
                      return (
                        <div
                          key={`slot-${index}`}
                          className="rounded-2xl border border-dashed border-ashen-700/60 bg-ashen-900/40 p-3 text-xs text-ashen-500"
                        >
                          Empty slot
                        </div>
                      )
                    }
                    const isMe = player.id === playerId
                    const showRole = isMe && player.role
                    const nightSelection =
                      room.status === 'night'
                        ? me?.role === 'werewolf'
                          ? nightActions?.werewolfTarget
                          : me?.role === 'bodyguard'
                            ? nightActions?.bodyguardProtect
                            : me?.role === 'seer'
                              ? nightActions?.seerInspect
                              : me?.role === 'witch'
                                ? nightActions?.witchPoisonTarget
                              : undefined
                        : undefined
                    const isSelected =
                      (room.status === 'voting' && myVote === player.id) ||
                      (room.status === 'night' && nightSelection === player.id)
                    const canSelect =
                      room.status === 'voting'
                        ? Boolean(me?.isAlive)
                        : room.status === 'night'
                          ? Boolean(
                              isNightMainStep &&
                                me?.isAlive &&
                                (me.role === 'werewolf' || me.role === 'bodyguard' || me.role === 'seer')
                            )
                          : Boolean(canHunterShoot)
                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          if (!canSelect) return
                          if (!player.isAlive) return
                          if (room.status === 'voting') {
                            setVote(player.id === playerId ? 'skip' : player.id)
                            return
                          }
                          if (room.status === 'night') {
                            if (!isNightMainStep) return
                            if (me?.role === 'werewolf' && player.id !== playerId) {
                              setNightAction({ werewolfTarget: player.id })
                            }
                            if (me?.role === 'bodyguard') {
                              if (player.id === room.bodyguardLastProtectedId) return
                              setNightAction({ bodyguardProtect: player.id })
                            }
                            if (me?.role === 'seer' && player.id !== playerId) {
                              setNightAction({ seerInspect: player.id })
                            }
                            return
                          }
                          if (canHunterShoot && player.id !== playerId) {
                            sendHunterShot(player.id)
                          }
                        }}
                        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-ashen-800/70 transition ${
                          isMe
                            ? 'border-ember shadow-[0_0_0_2px_rgba(245,176,76,0.35),0_14px_24px_rgba(0,0,0,0.35)]'
                            : 'border-ashen-700'
                        } ${player.isAlive ? 'opacity-100' : 'opacity-40'} ${
                          isSelected ? 'ring-2 ring-emerald-400/80' : ''
                        } ${canSelect ? 'cursor-pointer' : ''}`}
                      >
                        <div className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded-full bg-ashen-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ashen-100">
                          <span>{player.name}</span>
                          {isMe && <span className="text-[9px] text-ember">You</span>}
                        </div>
                        <div className="relative grid flex-1 place-items-center gap-2 bg-ashen-900/40 p-3 pt-7">
                          <div className="relative grid h-20 w-full place-items-center overflow-hidden rounded-xl border border-ashen-700 bg-ashen-800/60">
                            <Avatar seed={avatarSeed(player.id)} sizeClass="h-16 w-16" />
                          </div>
                          {!player.isAlive && (
                            <div
                              className="absolute right-2 top-2 rounded-full bg-ashen-900/80 px-2 py-1 text-[10px] text-ashen-300"
                              aria-label="Eliminated"
                            >
                              ☠
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 px-2 py-2 text-[9px] uppercase tracking-[0.2em] text-ashen-200">
                          <span className="rounded-full bg-ashen-700/70 px-2 py-1">
                            {player.isAlive ? 'Active' : 'Out'}
                          </span>
                          {room.status === 'lobby' && (
                            <span
                              className={`rounded-full px-2 py-1 ${
                                player.isReady
                                  ? 'bg-emerald-500/20 text-emerald-200'
                                  : 'bg-ashen-700/70 text-ashen-300'
                              }`}
                            >
                              {player.isReady ? 'Ready' : 'Not Ready'}
                            </span>
                          )}
                          {player.isHost && (
                            <span className="rounded-full bg-ember/20 px-2 py-1 text-ember">Crown</span>
                          )}
                          {showRole && player.role && (
                            <span className="rounded-full bg-ashen-700/70 px-2 py-1 text-ashen-100">
                              {roleIcons[player.role]} {player.role}
                            </span>
                          )}
                          {isHost && !isMe && (
                            <button
                              onClick={() => removePlayer(player.id)}
                              className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <aside className="space-y-4 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-3">
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">You</p>
                    <div className="mt-2 grid gap-1 text-sm text-ashen-200">
                      <p>
                        Role:{' '}
                        <span className="text-ashen-100">
                          {roleRevealed ? me?.role ?? '...' : '???'}
                        </span>
                      </p>
                      <p className="text-ashen-300">
                        {roleRevealed && me?.role
                          ? roleHints[me.role]
                          : 'Role hidden until the wheel stops.'}
                      </p>
                      <p>
                        Status:{' '}
                        <span className="text-ashen-100">{me?.isAlive ? 'Alive' : 'Eliminated'}</span>
                      </p>
                    </div>
                    {room.status === 'lobby' && (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-2">
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
                              disabled={!canStartWithCurrentSetup}
                              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Start Game
                            </button>
                          )}
                          {isHost && (
                            <button
                              onClick={resetLobby}
                              className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
                            >
                              Reset to Lobby
                            </button>
                          )}
                        </div>

                        {isHost && (
                          <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Game setup</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => setGameMode('classic')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                  gameMode === 'classic'
                                    ? 'bg-ember text-slate-950'
                                    : 'border border-ashen-500 text-ashen-100'
                                }`}
                              >
                                Classic
                              </button>
                              <button
                                onClick={() => setGameMode('custom')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                  gameMode === 'custom'
                                    ? 'bg-ember text-slate-950'
                                    : 'border border-ashen-500 text-ashen-100'
                                }`}
                              >
                                Custom
                              </button>
                            </div>

                            {gameMode === 'custom' && (
                              <div className="mt-3 space-y-2">
                                {customRoleOrder.map((role) => (
                                  <div key={role} className="flex items-center justify-between gap-2">
                                    <span className="capitalize text-xs text-ashen-200">{role}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setCustomRoleCount(role, (customRoles[role] ?? 0) - 1)}
                                        className="rounded-md border border-ashen-500 px-2 py-1 text-xs text-ashen-100"
                                      >
                                        -
                                      </button>
                                      <span className="w-5 text-center text-xs text-ashen-100">
                                        {customRoles[role] ?? 0}
                                      </span>
                                      <button
                                        onClick={() => setCustomRoleCount(role, (customRoles[role] ?? 0) + 1)}
                                        className="rounded-md border border-ashen-500 px-2 py-1 text-xs text-ashen-100"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <p className="text-xs text-ashen-300">
                                  Total roles: {customTotal} / Players: {orderedPlayers.length}
                                </p>
                                {!customHasWerewolf && (
                                  <p className="text-xs text-ember">Custom setup must include at least 1 werewolf.</p>
                                )}
                                {!customMatchesPlayers && (
                                  <p className="text-xs text-ember">Role total must match player count.</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {room.status === 'night' && me?.isAlive && (
                      <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3 text-sm text-ashen-200">
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Night actions</p>
                        <p className="mt-2">
                          {me.role === 'werewolf' &&
                            (isNightMainStep
                              ? 'Click a player in the grid to choose the werewolf target.'
                              : 'Waiting for the Witch to act.')}
                          {me.role === 'bodyguard' &&
                            (isNightMainStep
                              ? 'Click a player in the grid to protect them. You cannot protect the same player as last night.'
                              : 'Waiting for the Witch to act.')}
                          {me.role === 'bodyguard' &&
                            isNightMainStep &&
                            room.bodyguardLastProtectedId &&
                            ` Last protected: ${room.players[room.bodyguardLastProtectedId]?.name ?? 'Unknown'}.`}
                          {me.role === 'seer' &&
                            (isNightMainStep
                              ? 'Click a player in the grid to inspect them.'
                              : 'Waiting for the Witch to act.')}
                          {me.role === 'witch' &&
                            (isNightMainStep
                              ? 'Wait for Werewolf, Bodyguard, and Seer to finish. You act next.'
                              : 'Choose to heal the pending victim, poison a player, or pass.')}
                          {me.role === 'villager' && 'You have no night action.'}
                          {me.role === 'hunter' && 'You have no night action.'}
                        </p>
                      </div>
                    )}

                    {isWitchStep && (
                      <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3 text-sm text-ashen-200">
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Witch turn</p>
                        <p className="mt-2">
                          {nightVictimName
                            ? `Pending victim: ${nightVictimName}.`
                            : 'No pending victim tonight.'}
                        </p>
                        {canWitchAct && (
                          <div className="mt-3 space-y-2">
                            {!room.witchState?.healUsed && room.witchTurn?.pendingVictimId && (
                              <button
                                onClick={() => setWitchAction('heal')}
                                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200"
                              >
                                Use Heal Potion
                              </button>
                            )}
                            {!room.witchState?.poisonUsed && (
                              <div>
                                <p className="text-xs text-ashen-400">Poison target:</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {alivePlayers
                                    .filter((p) => p.id !== playerId)
                                    .map((player) => (
                                      <button
                                        key={player.id}
                                        onClick={() => setWitchAction('poison', player.id)}
                                        className="rounded-full bg-rose-500/20 px-3 py-1 text-xs text-rose-200"
                                      >
                                        {player.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => setWitchAction('pass')}
                              className="rounded-lg border border-ashen-500 px-3 py-2 text-xs font-semibold text-ashen-100"
                            >
                              Pass
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {room.status === 'day' && (
                      <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3 text-sm text-ashen-200">
                        {(lastNight?.killedIds?.length ?? 0) > 0 ? (
                          <p>
                            Dawn breaks.{' '}
                            {lastNight?.killedIds
                              ?.map((id) => room.players[id]?.name ?? 'Someone')
                              .join(', ')}{' '}
                            {lastNight?.killedIds?.length === 1 ? 'was' : 'were'} taken in the night.
                          </p>
                        ) : lastNight?.killedId ? (
                          <p>
                            Dawn breaks. {room.players[lastNight.killedId]?.name ?? 'Someone'} was taken in the
                            night.
                          </p>
                        ) : (
                          <p>No one was eliminated overnight.</p>
                        )}
                        {me?.role === 'seer' && lastNight?.seerResult && (
                          <p className="mt-2 text-ashen-100">
                            Your vision: {room.players[lastNight.seerResult.targetId]?.name} is a{' '}
                            {lastNight.seerResult.role}.
                          </p>
                        )}
                      </div>
                    )}

                    {room.status === 'voting' && me?.isAlive && (
                      <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3 text-sm text-ashen-200">
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Voting</p>
                        <p className="mt-2">Click a player card in the grid to vote. Click your own card to skip.</p>
                        <div className="mt-2 text-sm text-ashen-300">
                          {Object.values(room.votes ?? {}).length} vote(s) cast.
                        </div>
                      </div>
                    )}

                    {room.status === 'results' && (
                      <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3 text-sm text-ashen-200">
                        <p className="font-display text-xl text-ashen-100">
                          {room.winner === 'villagers' ? 'Villagers win!' : 'Werewolves win!'}
                        </p>
                        <p className="mt-2">{room.winReason}</p>
                      </div>
                    )}

                    {waitingForHunter && (
                      <div className="rounded-xl border border-ember/40 bg-ember/10 p-3 text-sm text-ashen-100">
                        Waiting for the Hunter's final shot...
                      </div>
                    )}

                    {canHunterShoot && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Hunter last shot</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alivePlayers
                            .filter((p) => p.id !== playerId)
                            .map((player) => (
                              <button
                                key={player.id}
                                onClick={() => sendHunterShot(player.id)}
                                className="rounded-full bg-ember px-3 py-1 text-xs text-slate-950"
                              >
                                {player.name}
                              </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-ashen-400">
                          You were eliminated. Choose one player to take with you.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-3 shadow-inky lg:flex lg:flex-1 lg:flex-col lg:min-h-0">
                <h3 className="font-display text-xl">Chat</h3>
                <div className="mt-2 flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                  {visibleMessages?.length ? (
                    visibleMessages.map((msg) => (
                      <div key={msg.id} className="text-sm text-ashen-200">
                        <span className="text-ashen-400">{msg.senderName}:</span> {msg.message}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ashen-400">No messages yet.</p>
                  )}
                </div>
                {isNight && !isWerewolf && (
                  <p className="mt-2 text-xs text-ashen-400">Night chat is for werewolves only.</p>
                )}
                {error && <p className="mt-2 text-xs text-ember">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        if (canChat && message.trim()) {
                          handleSend()
                        }
                      }
                    }}
                    placeholder="Say something..."
                    disabled={!canChat}
                    className="flex-1 rounded-lg border border-ashen-600 bg-ashen-800/80 px-3 py-2 text-sm text-ashen-100 outline-none focus:border-ember disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!canChat}
                    className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-4 lg:flex-none">
                <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Roles in play</p>
                <div className="mt-3 grid gap-2 text-sm text-ashen-100">
                  {Object.entries(
                    orderedPlayers.reduce<Record<string, number>>((acc, player) => {
                      if (!player.role) return acc
                      acc[player.role] = (acc[player.role] ?? 0) + 1
                      return acc
                    }, {})
                  ).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="capitalize">
                        {role} x{count}
                      </span>
                      <span className="text-ashen-400">Active</span>
                    </div>
                  ))}
                  {room.status === 'lobby' && (
                    <p className="text-xs text-ashen-400">Roles appear after the game starts.</p>
                  )}
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  )
}
