import { useNavigate } from 'react-router-dom'
import { useRoom } from '../state/room'

export default function LobbyPage() {
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
                    onClick={handleCreate}
                    disabled={loading}
                    className="rounded-lg bg-ember px-5 py-3 text-sm font-semibold text-slate-950 shadow-ember disabled:opacity-60"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="rounded-lg border border-ashen-500 px-5 py-3 text-sm font-semibold text-ashen-100 disabled:opacity-60"
                  >
                    Join Room
                  </button>
                </div>
                {status && <p className="text-sm text-ashen-300">{status}</p>}
                {error && <p className="text-sm text-ember">{error}</p>}
              </div>
            </section>

            <aside className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6 shadow-inky">
              <h3 className="font-display text-xl">Room Preview</h3>
              <div className="mt-4 grid gap-4">
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
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Next step</p>
                  <p className="mt-2 text-sm text-ashen-200">
                    Create a room or join with a code to start the lobby.
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
