import { HashRouter, Routes, Route } from 'react-router-dom'
import LobbyPage from './pages/LobbyPage'
import CreateRoomPage from './pages/CreateRoomPage'
import JoinRoomPage from './pages/JoinRoomPage'
import GameRoomPage from './pages/GameRoomPage'
import HistoryPage from './pages/HistoryPage'
import RoomHistoryPage from './pages/RoomHistoryPage'
import { Toaster } from './components/common/Toast'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/room/:roomCode" element={<GameRoomPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:roomId" element={<RoomHistoryPage />} />
        </Routes>
        <Toaster />
      </div>
    </HashRouter>
  )
}

export default App
