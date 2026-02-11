import { Navigate, Route, Routes } from 'react-router-dom'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import { RoomProvider } from './state/room'

export default function App() {
  return (
    <RoomProvider>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:code" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoomProvider>
  )
}
