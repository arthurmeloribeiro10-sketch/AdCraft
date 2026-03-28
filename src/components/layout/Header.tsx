import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Cpu, Settings, LogOut, User, Shield, ChevronDown } from 'lucide-react'
import { hasActiveApiKey } from '../../lib/apiKey'
import PlanBadge from '../ui/PlanBadge'
import { usePermissions } from '../../hooks/usePermissions'

const SECTION_MAP: Record<string, string> = {
  '/': 'Dashboard',
  '/roteiros': 'Gerador de Roteiros',
  '/copy': 'Gerador de Copy',
  '/video': 'Analisador de Vídeo',
  '/ideias': 'Ideias de Criativos',
  '/biblioteca': 'Biblioteca de Anúncios',
  '/tendencias': 'Radar de Tendências',
  '/historico': 'Histórico',
  '/perfil': 'Meu Perfil',
}

interface HeaderProps {
  onOpenSettings: () => void
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuth()
  const { planName } = usePermissions()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeSection = SECTION_MAP[location.pathname] ?? 'Adcraft'
  const aiReady = hasActiveApiKey()

  const displayName =
    profile?.full_name ??
    profile?.email?.split('@')[0] ??
    'Usuário'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() ?? '')
    .join('')

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <header className="fixed top-0 left-60 right-0 h-14 flex items-center justify-between px-6 bg-[rgba(8,8,15,0.85)] backdrop-blur-md border-b border-[rgba(170,59,255,0.08)] z-30">
      {/* Section name */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[#c4c4d4]">{activeSection}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* AI Status badge */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.15)] hover:border-[rgba(170,59,255,0.35)] transition-colors cursor-pointer"
          title="Configurar chave da OpenAI"
        >
          <Cpu size={13} className="text-[#aa3bff]" />
          <span className="text-xs text-[#c4c4d4] font-medium">AI</span>
          {aiReady ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pronto
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Config.
            </span>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b6b8a] hover:text-[#c4c4d4] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          title="Configurações"
        >
          <Settings size={15} />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[#c4c4d4] leading-none">{displayName}</p>
              <div className="mt-0.5">
                <PlanBadge plan={planName} variant="compact" />
              </div>
            </div>
            <ChevronDown
              size={12}
              className={`text-[#6b6b8a] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 glass border border-[rgba(170,59,255,0.15)] rounded-xl overflow-hidden shadow-2xl z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[rgba(170,59,255,0.08)]">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-[#6b6b8a] truncate mt-0.5">
                  {profile?.email}
                </p>
                <div className="mt-1.5">
                  <PlanBadge plan={planName} variant="compact" />
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => { navigate('/perfil'); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#c4c4d4] hover:bg-[rgba(170,59,255,0.08)] hover:text-white transition-colors text-left"
                >
                  <User size={13} className="text-[#6b6b8a]" />
                  Meu Perfil
                </button>

                <button
                  onClick={() => { onOpenSettings(); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#c4c4d4] hover:bg-[rgba(170,59,255,0.08)] hover:text-white transition-colors text-left"
                >
                  <Settings size={13} className="text-[#6b6b8a]" />
                  Configurações
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { navigate('/admin'); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#aa3bff] hover:bg-[rgba(170,59,255,0.08)] transition-colors text-left"
                  >
                    <Shield size={13} />
                    Painel Admin
                  </button>
                )}
              </div>

              <div className="border-t border-[rgba(170,59,255,0.08)] py-1.5">
                <button
                  onClick={() => { signOut(); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors text-left"
                >
                  <LogOut size={13} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
