import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ScriptGenerator from './pages/ScriptGenerator'
import CopyGenerator from './pages/CopyGenerator'
import VideoAnalyzer from './pages/VideoAnalyzer'
import CreativeIdeas from './pages/CreativeIdeas'
import WinnersLibrary from './pages/WinnersLibrary'
import TrendsRadar from './pages/TrendsRadar'
import ProjectHistory from './pages/ProjectHistory'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center animate-pulse">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#aa3bff] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/roteiros" element={<ScriptGenerator />} />
        <Route path="/copy" element={<CopyGenerator />} />
        <Route path="/video" element={<VideoAnalyzer />} />
        <Route path="/ideias" element={<CreativeIdeas />} />
        <Route path="/biblioteca" element={<WinnersLibrary />} />
        <Route path="/tendencias" element={<TrendsRadar />} />
        <Route path="/historico" element={<ProjectHistory />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
