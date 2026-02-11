const roles = ["Werewolf", "Seer", "Villager", "Doctor", "Hunter"]

export default function App() {
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
                Build the village
              </div>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Gather your friends. Start a room. Survive the night.
              </h2>
              <p className="text-base text-ashen-200 md:text-lg">
                This MVP is Firebase-only for fast iteration. We keep game state in Firestore and sync
                instantly across all players. Host a room, invite friends, and play live.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-lg bg-ember px-5 py-3 text-sm font-semibold text-slate-950 shadow-ember">
                  Create Room
                </button>
                <button className="rounded-lg border border-ashen-500 px-5 py-3 text-sm font-semibold text-ashen-100">
                  Join Room
                </button>
              </div>
            </section>

            <aside className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6 shadow-inky">
              <h3 className="font-display text-xl">Room Preview</h3>
              <div className="mt-4 grid gap-4">
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Players</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["You", "Mina", "Kai", "Jade", "Noah"].map((name) => (
                      <span key={name} className="rounded-full bg-ashen-700/80 px-3 py-1 text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-ashen-700 bg-ashen-800/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Night Deck</p>
                  <ul className="mt-2 grid gap-2 text-sm text-ashen-100">
                    {roles.map((role) => (
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
                    <span className="font-display text-2xl">Day 1</span>
                    <span className="rounded-full bg-ashen-700/80 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                      Voting
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ashen-700">
                    <div className="h-full w-3/4 bg-ember" />
                  </div>
                </div>
              </div>
            </aside>
          </main>

          <section className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Create / Join Rooms",
                text: "Invite friends with a short code and sync instantly with Firestore listeners.",
              },
              {
                title: "Day / Night Engine",
                text: "Phases, role actions, and voting with a serverless state machine.",
              },
              {
                title: "Next Up",
                text: "Lobby chat, role reveal animations, and results history.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
                <h4 className="font-display text-lg">{card.title}</h4>
                <p className="mt-2 text-sm text-ashen-200">{card.text}</p>
              </div>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border border-ashen-700 bg-ashen-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ashen-400">Setup</p>
                <h4 className="font-display text-lg">Add Firebase keys to .env</h4>
              </div>
              <span className="rounded-full border border-ashen-600 px-3 py-1 text-xs text-ashen-200">
                See .env.example
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ashen-200 md:grid-cols-2">
              <p>VITE_FIREBASE_API_KEY</p>
              <p>VITE_FIREBASE_AUTH_DOMAIN</p>
              <p>VITE_FIREBASE_PROJECT_ID</p>
              <p>VITE_FIREBASE_STORAGE_BUCKET</p>
              <p>VITE_FIREBASE_MESSAGING_SENDER_ID</p>
              <p>VITE_FIREBASE_APP_ID</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
