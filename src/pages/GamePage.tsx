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
                        className={`rounded-2xl border border-ashen-700 bg-ashen-800/70 p-4 transition ${
                          player.isAlive ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-semibold text-slate-950`}
                          >
                            {initials(player.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ashen-100">{player.name}</p>
                            <p className="text-xs text-ashen-400">
                              {player.isHost ? 'Host' : player.isAlive ? 'Alive' : 'Eliminated'}
                              {isMe ? ' • You' : ''}
                            </p>
                          </div>
                          {!player.isAlive && (
                            <div className="ml-auto text-lg text-ashen-500" aria-label="Eliminated">
                              ☠
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-ashen-700/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                            {player.isAlive ? 'Active' : 'Out'}
                          </span>
                          {player.isHost && (
                            <span className="rounded-full bg-ember/20 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-ember">
                              Crown
                            </span>
                          )}
                          {showRole && (
                            <span className="rounded-full bg-ashen-700/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-ashen-100">
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
