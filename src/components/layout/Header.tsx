import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Cpu, Settings } from 'lucide-react'
import { hasActiveApiKey } from '../../lib/apiKey'

const SECTION_MAP: Record<string, string> = {
  '/': 'Dashboard',
  '/roteiros': 'Gerador de Roteiros',
  '/copy': 'Gerador de Copy',
  '/video': 'Analisador de Vídeo',
  '/ideias': 'Ideias de Criativos',
  '/biblioteca': 'Biblioteca de Anúncios',
  '/tendencias': 'Radar de Tendências',
  '/historico': 'Histórico',
}

interface HeaderProps {
  onOpenSettings: () => void
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const location = useLocation()
  const { user } = useAuth()

  const activeSection = SECTION_MAP[location.pathname] ?? 'Adcraft'
  const firstName = user?.email?.split('@')[0] ?? 'Usuário'
  const aiReady = hasActiveApiKey()

  return (
    <header className="fixed top-0 left-60 right-0 h-14 flex items-center justify-between px-6 bg-[rgba(8,8,15,0.85)] backdrop-blur-md border-b border-[rgba(170,59,255,0.08)] z-30">
      {/* Section name */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[#c4c4d4]">{activeSection}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* AI Status badge — clicável para abrir configurações */}
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

        {/* User greeting */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6b6b8a]">
            Olá, <span className="text-[#c4c4d4] font-medium">{firstName}</span>
          </span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
