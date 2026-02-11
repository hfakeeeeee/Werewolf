# Night Council (Werewolf Online)

A real-time social deduction game built with React + TypeScript + Firebase Firestore.

## Features

- Real-time multiplayer rooms with 5-character room codes
- Lobby ready system and host controls
- Phases: `Lobby -> Night -> Day -> Voting -> Results`
- Roles:
  - `Werewolf`
  - `Seer`
  - `Bodyguard` (cannot protect the same player on consecutive nights)
  - `Witch` (acts after main night actions, one heal + one poison per game)
  - `Hunter`
  - `Villager`
- Day voting with skip option
- Hunter last-shot mechanic
- In-game chat
  - Night chat restricted to werewolves
  - Eliminated players cannot chat
- Host game setup modes:
  - `Classic`: auto role distribution
  - `Custom`: host sets exact role counts

## Tech Stack

- Vite
- React 19
- TypeScript
- Tailwind CSS
- Firebase Firestore

## Prerequisites

- Node.js 20+
- A Firebase project with Firestore enabled

## Environment Variables

Create `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can copy from `.env.example`.

## Install & Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## How to Play

1. Create a room or join with a room code.
2. Everyone marks ready in lobby.
3. Host starts game.
4. Night phase:
   - Werewolf selects target
   - Bodyguard selects protection target
   - Seer inspects one player
   - Witch turn starts after the above resolve to a pending victim
5. Day phase discussion, then voting.
6. Repeat until villagers or werewolves win.

## Witch Flow

- Main night actions (Werewolf/Bodyguard/Seer) happen first.
- Witch sees only the pending victim (not Bodyguard's exact choice).
- Witch can:
  - heal pending victim (one-time), or
  - poison a player (one-time), or
  - pass.

## Custom Game Mode

In lobby (host only), switch to `Custom` and set each role count.

Validation rules:

- Total role count must equal current player count
- At least 1 werewolf is required

If validation fails, Start Game is disabled and an error hint is shown.

## Project Structure

- `src/state/room.tsx`: core game state + Firestore sync + phase logic
- `src/pages/LobbyPage.tsx`: landing/lobby UI
- `src/pages/GamePage.tsx`: room gameplay UI
- `src/lib/types.ts`: shared TypeScript models
- `src/lib/firebase.ts`: Firebase initialization

## Notes

- Routing uses `HashRouter`.
- Player identity/name are persisted in local storage for rejoin convenience.
- Host can advance phase manually and reset to lobby.
