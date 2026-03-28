import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Users,
  CreditCard,
  Key,
  FileText,
  LayoutDashboard,
  ArrowLeft,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const ADMIN_NAV = [
  { label: 'Visão Geral', icon: LayoutDashboard, path: '/admin' },
  { label: 'Usuários', icon: Users, path: '/admin/usuarios' },
  { label: 'Planos', icon: CreditCard, path: '/admin/planos' },
  { label: 'API & Tokens', icon: Key, path: '/admin/tokens' },
  { label: 'Logs de Auditoria', icon: FileText, path: '/admin/auditoria' },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Visão Geral',
  '/admin/usuarios': 'Usuários',
  '/admin/planos': 'Planos',
  '/admin/tokens': 'API & Tokens',
  '/admin/auditoria': 'Logs de Auditoria',
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLabel = BREADCRUMB_MAP[location.pathname] ?? 'Admin'

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col bg-[#0f0f1a] border-r border-[rgba(170,59,255,0.1)] z-40">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[rgba(170,59,255,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center shadow-[0_0_12px_rgba(170,59,255,0.4)]">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Painel Admin</p>
              <p className="text-[9px] text-[#6b6b8a] leading-none mt-0.5">AdCraft</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-[#6b6b8a] hover:text-[#aa3bff] transition-colors group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao app
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs mb-0.5 transition-all duration-150',
                  isActive
                    ? 'bg-[rgba(170,59,255,0.12)] text-white border-l-2 border-[#aa3bff] pl-[10px]'
                    : 'text-[#6b6b8a] hover:text-[#c4c4d4] hover:bg-[rgba(255,255,255,0.04)] border-l-2 border-transparent'
                )}
              >
                <Icon size={14} className={isActive ? 'text-[#aa3bff]' : 'text-[#6b6b8a]'} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[rgba(170,59,255,0.08)]">
          <p className="text-[9px] text-[#6b6b8a]">AdCraft Admin v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-56">
        {/* Top bar */}
        <header className="fixed top-0 left-56 right-0 h-12 flex items-center justify-between px-6 bg-[rgba(8,8,15,0.9)] backdrop-blur-md border-b border-[rgba(170,59,255,0.08)] z-30">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#6b6b8a]">
            <Shield size={12} className="text-[#aa3bff]" />
            <span className="text-[#aa3bff] font-medium">Admin</span>
            <ChevronRight size={12} />
            <span className="text-[#c4c4d4]">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(170,59,255,0.15)] text-[#aa3bff] border border-[rgba(170,59,255,0.25)]">
              ADMIN
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto mt-12 p-6" style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
