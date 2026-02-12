import { Navigate, Route, Routes } from 'react-router-dom'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import { RoomProvider } from './state/room'
import { ThemeProvider } from './state/theme'

export default function App() {
  return (
    <ThemeProvider>
      <RoomProvider>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/room/:code" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoomProvider>
    </ThemeProvider>
  )
}
