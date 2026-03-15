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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Gerador de Roteiros', icon: FileText, path: '/roteiros' },
  { label: 'Gerador de Copy', icon: PenTool, path: '/copy' },
  { label: 'Analisador de Vídeo', icon: Video, path: '/video' },
  { label: 'Ideias de Criativos', icon: Lightbulb, path: '/ideias' },
  { label: 'Biblioteca de Anúncios', icon: BookOpen, path: '/biblioteca' },
  { label: 'Radar de Tendências', icon: TrendingUp, path: '/tendencias' },
  { label: 'Histórico', icon: History, path: '/historico' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { setActiveSection } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (item: NavItem) => {
    setActiveSection(item.label)
    navigate(item.path)
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

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
          const active = isActive(item.path)
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
                className={active ? 'text-[#aa3bff]' : 'text-[#6b6b8a]'}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User area */}
      <div className="p-3 border-t border-[rgba(170,59,255,0.08)]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c4c4d4] truncate">
              {user?.email ?? 'usuario@email.com'}
            </p>
            <p className="text-[10px] text-[#6b6b8a]">Pro Plan</p>
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
