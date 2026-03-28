import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RouteGuard, AdminGuard, FeatureGuard } from './components/guards/RouteGuard'
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
import UserProfile from './pages/UserProfile'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/index'
import UserManagement from './pages/admin/UserManagement'
import PlanManagement from './pages/admin/PlanManagement'
import TokenManagement from './pages/admin/TokenManagement'
import AuditLogs from './pages/admin/AuditLogs'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<UserManagement />} />
            <Route path="planos" element={<PlanManagement />} />
            <Route path="tokens" element={<TokenManagement />} />
            <Route path="auditoria" element={<AuditLogs />} />
          </Route>

          {/* Protected app routes */}
          <Route
            path="/*"
            element={
              <RouteGuard>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/roteiros" element={
                      <FeatureGuard feature="scriptGenerator">
                        <ScriptGenerator />
                      </FeatureGuard>
                    } />
                    <Route path="/copy" element={
                      <FeatureGuard feature="copyGenerator">
                        <CopyGenerator />
                      </FeatureGuard>
                    } />
                    <Route path="/video" element={
                      <FeatureGuard feature="videoAnalyzer">
                        <VideoAnalyzer />
                      </FeatureGuard>
                    } />
                    <Route path="/ideias" element={
                      <FeatureGuard feature="creativeIdeas">
                        <CreativeIdeas />
                      </FeatureGuard>
                    } />
                    <Route path="/biblioteca" element={
                      <FeatureGuard feature="winnersLibrary">
                        <WinnersLibrary />
                      </FeatureGuard>
                    } />
                    <Route path="/tendencias" element={
                      <FeatureGuard feature="trendsRadar">
                        <TrendsRadar />
                      </FeatureGuard>
                    } />
                    <Route path="/historico" element={
                      <FeatureGuard feature="projectHistory">
                        <ProjectHistory />
                      </FeatureGuard>
                    } />
                    <Route path="/perfil" element={<UserProfile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </RouteGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
