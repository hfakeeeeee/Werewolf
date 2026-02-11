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

export default function GamePage() {
  const navigate = useNavigate()
  const { code } = useParams()
  const [message, setMessage] = useState('')
  const {
    playerId,
    setActiveCode,
    room,
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
        <div className="hero-glow" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ember" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-ashen-400">Werewolf Online</p>
                <h1 className="font-display text-2xl">Room {room.code}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                {phaseLabels[room.status]}
              </span>
              <button
                onClick={goBack}
                className="rounded-lg border border-ashen-500 px-4 py-2 text-sm font-semibold text-ashen-100"
              >
                Leave Room
              </button>
            </div>
          </header>

          <main className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              {room.status === 'lobby' && (
                <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Lobby</p>
                      <h2 className="font-display text-2xl">Waiting for players</h2>
                    </div>
                    {isHost && (
                      <button
                        onClick={startGame}
                        className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Start Game
                      </button>
                    )}
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
                  </div>
                </div>
              )}

              {room.status !== 'lobby' && (
                <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Phase</p>
                      <h2 className="font-display text-2xl">
                        {phaseLabels[room.status]} · Day {room.dayCount || 1}
                      </h2>
                    </div>
                    {countdown !== null && (
                      <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                        {countdown}s left
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-ashen-200">
                    <p>
                      You are <span className="text-ashen-100">{me?.role ?? '...'}.</span>
                    </p>
                    <p className="text-ashen-300">{me?.role ? roleHints[me.role] : ''}</p>
                    <p>
                      Status: <span className="text-ashen-100">{me?.isAlive ? 'Alive' : 'Eliminated'}</span>
                    </p>
                  </div>

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
                          Dawn breaks. {room.players[lastNight.killedId]?.name ?? 'Someone'} was taken in
                          the night.
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

                  <div className="mt-4 flex flex-wrap gap-3">
                    {isHost && room.status !== 'results' && (
                      <button
                        onClick={advancePhase}
                        className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Advance Phase
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

                  <div className="mt-6 rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Players</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.values(room.players).map((player) => (
                        <span
                          key={player.id}
                          className={`rounded-full px-3 py-1 text-xs ${
                            player.isAlive ? 'bg-ashen-700/80 text-ashen-100' : 'bg-ashen-800 text-ashen-500'
                          }`}
                        >
                          {player.name}
                          {player.id === playerId ? ' • You' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6 shadow-inky">
              <h3 className="font-display text-xl">Chat</h3>
              <div className="mt-4 flex h-[320px] flex-col gap-3 overflow-y-auto rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                {room.chat?.length ? (
                  room.chat.map((msg) => (
                    <div key={msg.id} className="text-sm text-ashen-200">
                      <span className="text-ashen-400">{msg.senderName}:</span> {msg.message}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ashen-400">No messages yet.</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Say something..."
                  className="flex-1 rounded-lg border border-ashen-600 bg-ashen-800/80 px-3 py-2 text-sm text-ashen-100 outline-none focus:border-ember"
                />
                <button
                  onClick={handleSend}
                  className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Send
                </button>
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
