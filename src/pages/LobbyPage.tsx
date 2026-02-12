import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../state/room'

const featureChips = [
  { icon: '\u{1F43A}', title: 'Werewolves', text: 'Hunt at night' },
  { icon: '\u{1F52E}', title: 'Seer', text: 'Reveal one role' },
  { icon: '\u{1F6E1}', title: 'Bodyguard', text: 'Protect one player' },
  { icon: '\u{1F9EA}', title: 'Witch', text: 'Heal or poison once' },
  { icon: '\u{1F3F9}', title: 'Hunter', text: 'Final revenge shot' },
]

export default function LobbyPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const navigate = useNavigate()
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
    <div className="h-dvh overflow-hidden bg-ashen text-slate-100">
      <div className="relative h-full overflow-hidden">
        <div className="hero-glow" />
        <div className="lobby-fireflies" />
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="parallax-layer parallax-slow" />
          <div className="parallax-layer parallax-fast" />
        </div>

        <div className="lobby-shell relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-ember text-lg font-semibold text-slate-950 shadow-ember">
                W
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-ashen-300 sm:text-xs">
                  Werewolf Online
                </p>
                <h1 className="font-display text-2xl sm:text-3xl">Night Council</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-ashen-600 bg-ashen-900/50 px-3 py-1 text-ashen-200">
                Social Deduction
              </span>
              <span className="rounded-full border border-ashen-600 bg-ashen-900/50 px-3 py-1 text-ashen-200">
                One Screen Lobby
              </span>
            </div>
          </header>

          <main className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] xl:gap-4">
            <section className="flex min-h-0 flex-col rounded-3xl border border-ashen-700/80 bg-ashen-900/70 p-3 shadow-inky backdrop-blur sm:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-ashen-600 bg-ashen-800/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-ashen-200">
                    The Village Awaits
                  </div>
                  <h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl xl:text-4xl">
                    Bluff hard. Vote smart. Survive the night.
                  </h2>
                  <p className="lobby-tight-copy mt-2 text-sm text-ashen-200">
                    Join your friends, receive a secret role, and outplay the pack before dawn.
                  </p>
                </div>

                <div className="hero-art lobby-float-card">
                  <div className="mist" />
                  <div className="moon-orbit">
                    <div className="moon" />
                  </div>
                  <svg viewBox="0 0 420 180" className="wolf-silhouette" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M0 160h420v20H0zM85 150l28-22 15 5 18-20 24 12 18-13 28 10 16-9 25 11 20-15 26 13 17-6 29 14v40H85z"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-3 grid gap-2 rounded-2xl border border-ashen-700 bg-ashen-900/80 p-3 sm:p-4">
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/60 p-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setActiveTab('create')}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                        activeTab === 'create'
                          ? 'lobby-cta text-slate-950'
                          : 'bg-ashen-900/30 text-ashen-200 hover:bg-ashen-700/60'
                      }`}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                        activeTab === 'join'
                          ? 'lobby-cta text-slate-950'
                          : 'bg-ashen-900/30 text-ashen-200 hover:bg-ashen-700/60'
                      }`}
                    >
                      Join
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] uppercase tracking-[0.25em] text-ashen-400">Your name</label>
                  <input
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="Enter a nickname"
                    className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-2.5 text-sm text-ashen-100 outline-none focus:border-ember"
                  />
                </div>

                {activeTab === 'join' && (
                  <div className="grid gap-2">
                    <label className="text-[11px] uppercase tracking-[0.25em] text-ashen-400">Room code</label>
                    <input
                      value={roomCode}
                      onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                      placeholder="ABCDE"
                      className="rounded-lg border border-ashen-600 bg-ashen-800/80 px-4 py-2.5 text-sm uppercase tracking-[0.2em] text-ashen-100 outline-none focus:border-ember"
                    />
                  </div>
                )}

                {activeTab === 'create' ? (
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="lobby-cta rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
                  >
                    Summon Room
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="rounded-lg border border-ashen-500 bg-ashen-800/40 px-5 py-2.5 text-sm font-semibold text-ashen-100 transition hover:border-ember disabled:opacity-60"
                  >
                    Enter Room
                  </button>
                )}

                <div className="min-h-5 text-xs sm:text-sm">
                  {status && <p className="text-ashen-300">{status}</p>}
                  {error && <p className="text-ember">{error}</p>}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {featureChips.map((item) => (
                  <div
                    key={item.title}
                    className="lobby-float-card rounded-xl border border-ashen-700 bg-ashen-900/80 px-3 py-2.5"
                  >
                    <p className="text-lg leading-none">{item.icon}</p>
                    <p className="mt-1 font-display text-sm">{item.title}</p>
                    <p className="text-xs text-ashen-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="flex min-h-0 flex-col rounded-3xl border border-ashen-700/80 bg-ashen-900/80 p-3 shadow-inky backdrop-blur sm:p-4">
              <h3 className="font-display text-lg sm:text-xl">Tonight's Briefing</h3>

              <div className="mt-3 grid gap-2 text-sm text-ashen-200 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ashen-400">Night</p>
                  <p className="mt-1 text-xs">Werewolves strike. Seer, Bodyguard, and Witch act in secret.</p>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ashen-400">Day</p>
                  <p className="mt-1 text-xs">Debate, accuse, and force lies into the open.</p>
                </div>
                <div className="lobby-optional rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ashen-400">Vote</p>
                  <p className="mt-1 text-xs">Majority decides who faces elimination.</p>
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 rounded-xl border border-ashen-700 bg-ashen-800/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-ashen-400">Players in room</p>
                <div className="mt-2 flex h-full max-h-40 flex-wrap content-start gap-2 overflow-y-auto pr-1 text-xs text-ashen-200">
                  {room
                    ? Object.values(room.players).map((player) => (
                        <span key={player.id} className="rounded-full border border-ashen-600 bg-ashen-700/80 px-3 py-1">
                          {player.name}
                        </span>
                      ))
                    : 'Waiting for players'}
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  )
}
