import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../state/room'

export default function LobbyPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const {
    playerName,
    setPlayerName,
    roomCode,
    setRoomCode,
    room,
    loading,
    status,
    error,
    createRoom,
    joinRoom,
  } = useRoom()

  const handleCreate = async () => {
    const code = await createRoom()
    if (code) navigate(`/room/${code}`)
  }

  const handleJoin = async () => {
    const code = await joinRoom()
    if (code) navigate(`/room/${code}`)
  }

  return (
    <div className="min-h-screen bg-ashen text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className="relative overflow-hidden">
        <div className="hero-glow" />
        <div className="mx-auto max-w-6xl px-6 py-8 lg:h-full">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ember text-lg font-semibold text-slate-950">
                W
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-ashen-400">Werewolf Online</p>
                <h1 className="font-display text-2xl">Night Council</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                Moonlit Sessions
              </span>
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                Pack Ready
              </span>
            </div>
          </header>

          <main className="mt-8 grid gap-8 lg:h-[calc(100vh-120px)] lg:grid-cols-[1.15fr_0.85fr] lg:overflow-hidden">
            <section className="space-y-5 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-ashen-600 bg-ashen-800/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-ashen-200">
                The Village Awaits
              </div>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Fear the night. Trust the whispers.
              </h2>
              <p className="text-base text-ashen-200 md:text-lg">
                Create a private den for your pack or join a friend’s village. Roles are dealt, secrets
                are kept, and the night always wins.
              </p>
              <div className="hero-art h-[150px]">
                <div className="moon-orbit">
                  <div className="moon" />
                </div>
                <svg viewBox="0 0 400 160" className="wolf-silhouette" aria-hidden="true">
                  <path
                    d="M40 130c40-22 68-34 98-40 22-4 44-4 70 0l24-24 30 10 24-18 24 20 24 6 36 36h-54l-20 22-36 8-20-10-18 16-30-6-18-20-24 16-22-8-14 12-34-4z"
                    fill="currentColor"
                  />
                </svg>
                <div className="mist" />
              </div>

              <div className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-5">
                <div className="flex gap-2 rounded-full border border-ashen-700 bg-ashen-800/80 p-1 text-xs uppercase tracking-[0.3em]">
                  <button
                    onClick={() => setTab('create')}
                    className={`flex-1 rounded-full px-3 py-2 ${
                      tab === 'create' ? 'bg-ember text-slate-950' : 'text-ashen-200'
                    }`}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setTab('join')}
                    className={`flex-1 rounded-full px-3 py-2 ${
                      tab === 'join' ? 'bg-ember text-slate-950' : 'text-ashen-200'
                    }`}
                  >
                    Join
                  </button>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-ashen-400">Your name</label>
                    <input
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      placeholder="Enter a nickname"
                      className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-3 text-sm text-ashen-100 outline-none focus:border-ember"
                    />
                  </div>
                  {tab === 'join' && (
                    <div className="grid gap-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-ashen-400">Room code</label>
                      <input
                        value={roomCode}
                        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                        placeholder="ABCDE"
                        className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-3 text-sm text-ashen-100 outline-none focus:border-ember"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {tab === 'create' ? (
                      <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="rounded-lg bg-ember px-5 py-3 text-sm font-semibold text-slate-950 shadow-ember disabled:opacity-60"
                      >
                        Create Room
                      </button>
                    ) : (
                      <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="rounded-lg bg-ember px-5 py-3 text-sm font-semibold text-slate-950 shadow-ember disabled:opacity-60"
                      >
                        Join Room
                      </button>
                    )}
                  </div>
                  {status && <p className="text-sm text-ashen-300">{status}</p>}
                  {error && <p className="text-sm text-ember">{error}</p>}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: 'Moonlit Rooms',
                    text: 'Private invite codes keep your village hidden from the night.',
                  },
                  {
                    title: 'Role Shadows',
                    text: 'Werewolf, Seer, Doctor, and Hunter arrive with bespoke actions.',
                  },
                  {
                    title: 'Real-Time Pulse',
                    text: 'Every whisper updates instantly through Firestore.',
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-5">
                    <h3 className="font-display text-lg">{card.title}</h3>
                    <p className="mt-2 text-sm text-ashen-200">{card.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-5 shadow-inky lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
              <h3 className="font-display text-xl">Village Preview</h3>
              <div className="mt-3 grid gap-3 lg:flex-1 lg:overflow-auto">
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Players</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ashen-200">
                    {room
                      ? Object.values(room.players).map((player) => (
                          <span key={player.id} className="rounded-full bg-ashen-700/80 px-3 py-1">
                            {player.name}
                          </span>
                        ))
                      : 'Waiting for players'}
                  </div>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">How it Works</p>
                  <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-ashen-200">
                    <li>Create a den or join with a code.</li>
                    <li>Ready up when everyone arrives.</li>
                    <li>Survive the night and vote at dawn.</li>
                  </ol>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Tip</p>
                  <p className="mt-2 text-sm text-ashen-200">
                    Keep your role secret. The village only survives if the wolves are exposed.
                  </p>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  )
}
