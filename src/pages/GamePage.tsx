import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../state/room'
import type { Role } from '../lib/types'

const roleHints: Record<Role, string> = {
  werewolf: 'Coordinate with other werewolves and strike together.',
  seer: 'Inspect a player each night to learn their role.',
  doctor: 'Choose someone to save from the werewolf attack.',
  hunter: 'If you fall, pick one player to take down with you.',
  villager: 'Discuss, deduce, and vote to eliminate werewolves.',
}

const avatarPalette = [
  'from-amber-200 to-rose-300',
  'from-emerald-200 to-teal-300',
  'from-sky-200 to-indigo-300',
  'from-fuchsia-200 to-purple-300',
  'from-orange-200 to-yellow-300',
  'from-lime-200 to-emerald-300',
]

const roleIcons: Record<Role, string> = {
  werewolf: '🐺',
  seer: '🔮',
  doctor: '🩺',
  hunter: '🏹',
  villager: '🧑‍🌾',
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

function pickGradient(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 3)) % avatarPalette.length
  }
  return avatarPalette[hash]
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

function Avatar({ seed }: { seed: number }) {
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
    <svg viewBox="0 0 140 140" className="h-24 w-24" aria-hidden="true">
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
  const {
    playerId,
    setActiveCode,
    room,
    error,
    me,
    isHost,
    countdown,
    phaseLabels,
    rolesPalette,
    toggleReady,
    rejoinRoom,
    leaveRoom,
    startGame,
    advancePhase,
    resetLobby,
    setVote,
    setNightAction,
    sendChat,
    sendHunterShot,
  } = useRoom()

  useEffect(() => {
    if (!code) return
    setActiveCode(code)
  }, [code, setActiveCode])

  const alivePlayers = useMemo(
    () => (room ? Object.values(room.players).filter((p) => p.isAlive) : []),
    [room]
  )

  const myVote = room?.votes?.[playerId]
  const nightActions = room?.nightActions
  const lastNight = room?.lastNight
  const isNight = room?.status === 'night'
  const isWerewolf = me?.role === 'werewolf'
  const canChat = Boolean(me?.isAlive && (!isNight || isWerewolf))
  const canHunterShoot = room?.hunterPending === playerId
  const waitingForHunter = Boolean(room?.hunterPending && !canHunterShoot)
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
    <div className="min-h-screen bg-ashen text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="parallax-layer parallax-slow" />
          <div className="parallax-layer parallax-fast" />
        </div>
        <div className="hero-glow" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
          <header className="flex flex-wrap items-center justify-between gap-4">
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
              {countdown !== null && room.status !== 'lobby' && room.status !== 'results' && (
                <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                  {countdown}s left
                </span>
              )}
              <button
                onClick={goBack}
                className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
              >
                Leave Room
              </button>
            </div>
          </header>

          <main className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-6">
              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Phase</p>
                    <h2 className="font-display text-2xl">
                      {phaseLabels[room.status]} · Day {room.dayCount || 1}
                    </h2>
                  </div>
                  {isHost && room.status !== 'results' && (
                    <button
                      onClick={advancePhase}
                      className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      Advance Phase
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-ashen-200">
                  <p>
                    You are <span className="text-ashen-100">{me?.role ?? '...'}</span>
                  </p>
                  <p className="text-ashen-300">{me?.role ? roleHints[me.role] : ''}</p>
                  <p>
                    Status: <span className="text-ashen-100">{me?.isAlive ? 'Alive' : 'Eliminated'}</span>
                  </p>
                </div>
                {room.status === 'lobby' && (
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
                )}

                {room.status === 'night' && me?.isAlive && (
                  <div className="mt-4 space-y-4">
                    {me.role === 'werewolf' && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Werewolf target</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alivePlayers
                            .filter((p) => p.id !== playerId)
                            .map((player) => (
                              <button
                                key={player.id}
                                onClick={() => setNightAction({ werewolfTarget: player.id })}
                                className={`rounded-full px-3 py-1 text-xs ${
                                  nightActions?.werewolfTarget === player.id
                                    ? 'bg-ember text-slate-950'
                                    : 'bg-ashen-700/70 text-ashen-100'
                                }`}
                              >
                                {player.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {me.role === 'doctor' && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Doctor save</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alivePlayers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => setNightAction({ doctorSave: player.id })}
                              className={`rounded-full px-3 py-1 text-xs ${
                                nightActions?.doctorSave === player.id
                                  ? 'bg-ember text-slate-950'
                                  : 'bg-ashen-700/70 text-ashen-100'
                              }`}
                            >
                              {player.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {me.role === 'seer' && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Seer inspect</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alivePlayers
                            .filter((p) => p.id !== playerId)
                            .map((player) => (
                              <button
                                key={player.id}
                                onClick={() => setNightAction({ seerInspect: player.id })}
                                className={`rounded-full px-3 py-1 text-xs ${
                                  nightActions?.seerInspect === player.id
                                    ? 'bg-ember text-slate-950'
                                    : 'bg-ashen-700/70 text-ashen-100'
                                }`}
                              >
                                {player.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {room.status === 'day' && (
                  <div className="mt-4 rounded-xl border border-ashen-700 bg-ashen-800/70 p-4 text-sm text-ashen-200">
                    {lastNight?.killedId ? (
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
                  <div className="mt-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Vote to eliminate</p>
                    <div className="flex flex-wrap gap-2">
                      {alivePlayers
                        .filter((p) => p.id !== playerId)
                        .map((player) => (
                          <button
                            key={player.id}
                            onClick={() => setVote(player.id)}
                            className={`rounded-full px-3 py-1 text-xs ${
                              myVote === player.id
                                ? 'bg-ember text-slate-950'
                                : 'bg-ashen-700/70 text-ashen-100'
                            }`}
                          >
                            {player.name}
                          </button>
                        ))}
                      <button
                        onClick={() => setVote('skip')}
                        className={`rounded-full px-3 py-1 text-xs ${
                          myVote === 'skip' ? 'bg-ember text-slate-950' : 'bg-ashen-700/70 text-ashen-100'
                        }`}
                      >
                        Skip
                      </button>
                    </div>
                    <div className="text-sm text-ashen-300">
                      {Object.values(room.votes ?? {}).length} vote(s) cast.
                    </div>
                  </div>
                )}

                {room.status === 'results' && (
                  <div className="mt-4 rounded-xl border border-ashen-700 bg-ashen-800/70 p-4 text-sm text-ashen-200">
                    <p className="font-display text-xl text-ashen-100">
                      {room.winner === 'villagers' ? 'Villagers win!' : 'Werewolves win!'}
                    </p>
                    <p className="mt-2">{room.winReason}</p>
                  </div>
                )}

                {waitingForHunter && (
                  <div className="mt-4 rounded-xl border border-ember/40 bg-ember/10 p-4 text-sm text-ashen-100">
                    Waiting for the Hunter's final shot...
                  </div>
                )}

                {canHunterShoot && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Hunter last shot</p>
                    <div className="flex flex-wrap gap-2">
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
                    <p className="text-xs text-ashen-400">
                      You were eliminated. Choose one player to take with you.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  {isHost && (
                    <button
                      onClick={resetLobby}
                      className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
                    >
                      Reset to Lobby
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Players</p>
                    <h3 className="font-display text-xl">Village Roster</h3>
                  </div>
                  <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                    {alivePlayers.length} alive / {Object.keys(room.players).length} total
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.values(room.players).map((player) => {
                    const gradient = pickGradient(player.id)
                    const isMe = player.id === playerId
                    const showRole = isMe && player.role
                    return (
                      <div
                        key={player.id}
                        className={`overflow-hidden rounded-2xl border border-ashen-700 bg-ashen-800/70 transition ${
                          player.isAlive ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                            isMe ? 'bg-ember text-slate-950' : 'bg-ashen-700 text-ashen-100'
                          }`}
                        >
                          <span>{player.name}</span>
                          {isMe && <span className="text-[10px]">You</span>}
                        </div>
                        <div className="relative grid place-items-center gap-3 bg-ashen-900/40 p-4">
                          <div
                            className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-lg font-semibold text-slate-950 shadow-lg`}
                          >
                            {initials(player.name)}
                          </div>
                          <div className="relative grid h-24 w-full place-items-center rounded-xl border border-ashen-700 bg-ashen-800/60">
                            <Avatar seed={avatarSeed(player.id)} />
                          </div>
                          {!player.isAlive && (
                            <div
                              className="absolute right-3 top-3 rounded-full bg-ashen-900/80 px-2 py-1 text-xs text-ashen-300"
                              aria-label="Eliminated"
                            >
                              ☠
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 px-3 py-3 text-[10px] uppercase tracking-[0.2em] text-ashen-200">
                          <span className="rounded-full bg-ashen-700/70 px-2 py-1">
                            {player.isAlive ? 'Active' : 'Out'}
                          </span>
                          {player.isHost && (
                            <span className="rounded-full bg-ember/20 px-2 py-1 text-ember">Crown</span>
                          )}
                          {showRole && (
                            <span className="rounded-full bg-ashen-700/70 px-2 py-1 text-ashen-100">
                              {roleIcons[player.role]} {player.role}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6 shadow-inky">
                <h3 className="font-display text-xl">Chat</h3>
                <div className="mt-4 flex h-[320px] flex-col gap-3 overflow-y-auto rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
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
                <div className="mt-4 flex gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
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

              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Roles in play</p>
                <div className="mt-3 grid gap-2 text-sm text-ashen-100">
                  {rolesPalette.map((role) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="capitalize">{role}</span>
                      <span className="text-ashen-400">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  )
}
