import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  PenTool,
  Video,
  Lightbulb,
  BookOpen,
  TrendingUp,
  History,
  Zap,
  LogOut,
  Shield,
  Lock,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/useStore'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../lib/utils'
import PlanBadge from '../ui/PlanBadge'
import UsageMeter from '../ui/UsageMeter'
import type { PlanFeatures } from '../../types/auth'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  feature?: keyof PlanFeatures
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Gerador de Roteiros', icon: FileText, path: '/roteiros', feature: 'scriptGenerator' },
  { label: 'Gerador de Copy', icon: PenTool, path: '/copy', feature: 'copyGenerator' },
  { label: 'Analisador de Vídeo', icon: Video, path: '/video', feature: 'videoAnalyzer' },
  { label: 'Ideias de Criativos', icon: Lightbulb, path: '/ideias', feature: 'creativeIdeas' },
  { label: 'Biblioteca de Anúncios', icon: BookOpen, path: '/biblioteca', feature: 'winnersLibrary' },
  { label: 'Radar de Tendências', icon: TrendingUp, path: '/tendencias', feature: 'trendsRadar' },
  { label: 'Histórico', icon: History, path: '/historico', feature: 'projectHistory' },
]

export default function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth()
  const { setActiveSection } = useStore()
  const { canAccess, planName, isActive } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (item: NavItem) => {
    setActiveSection(item.label)
    navigate(item.path)
  }

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const displayName =
    profile?.full_name ??
    profile?.email?.split('@')[0] ??
    'Usuário'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col bg-[#0f0f1a] border-r border-[rgba(170,59,255,0.1)] z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[rgba(170,59,255,0.08)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#aa3bff] to-[#6366f1] shadow-[0_0_16px_rgba(170,59,255,0.4)]">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-gradient text-lg font-bold tracking-tight">Adcraft</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActivePath(item.path)
          const hasAccess = item.feature ? canAccess(item.feature) : true
          const isLocked = !hasAccess && !isAdmin

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-0.5 text-left',
                active
                  ? 'bg-[rgba(170,59,255,0.12)] text-white border-l-2 border-[#aa3bff] pl-[10px] shadow-[0_0_16px_rgba(170,59,255,0.08)]'
                  : 'text-[#6b6b8a] hover:text-[#c4c4d4] hover:bg-[rgba(255,255,255,0.04)] border-l-2 border-transparent'
              )}
            >
              <Icon
                size={16}
                className={active ? 'text-[#aa3bff]' : isLocked ? 'text-[#6b6b8a] opacity-50' : 'text-[#6b6b8a]'}
              />
              <span className={cn('truncate flex-1', isLocked && 'opacity-60')}>
                {item.label}
              </span>
              {isLocked && (
                <Lock size={11} className="text-[#6b6b8a] opacity-60 shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Usage meter */}
      {profile && (
        <div className="px-3 pb-1 border-t border-[rgba(170,59,255,0.05)] pt-2">
          <UsageMeter compact />
        </div>
      )}

      {/* User area */}
      <div className="p-3 border-t border-[rgba(170,59,255,0.08)]">
        {/* Admin link */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#aa3bff] hover:bg-[rgba(170,59,255,0.08)] transition-all mb-2 border border-[rgba(170,59,255,0.12)] hover:border-[rgba(170,59,255,0.25)]"
          >
            <Shield size={13} />
            <span className="flex-1 text-left">Painel Admin</span>
          </button>
        )}

        {/* User info */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
          <button
            onClick={() => navigate('/perfil')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
            title="Meu Perfil"
          >
            <span className="text-white text-[11px] font-semibold">
              {initials || <User size={12} />}
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c4c4d4] truncate">{displayName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <PlanBadge plan={planName} variant="compact" />
              {!isActive && (
                <span className="text-[9px] text-red-400">Inativo</span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 p-1.5 rounded-md text-[#6b6b8a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
