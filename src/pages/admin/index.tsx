import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Activity,
  AlertTriangle,
  Shield,
  TrendingUp,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { AuditLog } from '../../types/auth'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  byPlan: { name: string; display_name: string; count: number; color: string }[]
  apiCallsToday: number
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#9ca3af',
  pro: '#6366f1',
  elite: '#aa3bff',
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    byPlan: [],
    apiCallsToday: 0,
  })
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [nearLimitUsers, setNearLimitUsers] = useState<
    { email: string; today: number; limit: number; percent: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)

    // Load profiles + plans
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, is_active, api_calls_today, plan_id, plan:plans(name, display_name, api_limit_daily)')

    if (profiles) {
      const total = profiles.length
      const active = profiles.filter((p) => p.is_active).length
      const apiToday = profiles.reduce((sum, p) => sum + (p.api_calls_today ?? 0), 0)

      // Group by plan
      const planMap: Record<string, { name: string; display_name: string; count: number }> = {}
      for (const p of profiles) {
        const plan = Array.isArray(p.plan) ? p.plan[0] : p.plan
        const key = plan?.name ?? 'none'
        const displayName = plan?.display_name ?? 'Sem Plano'
        if (!planMap[key]) planMap[key] = { name: key, display_name: displayName, count: 0 }
        planMap[key].count++
      }

      // Near limit users (>= 80%)
      const near = profiles
        .filter((p) => {
          const plan = Array.isArray(p.plan) ? p.plan[0] : p.plan
          const limit = plan?.api_limit_daily ?? 10
          return limit > 0 && (p.api_calls_today ?? 0) / limit >= 0.8
        })
        .map((p) => {
          const plan = Array.isArray(p.plan) ? p.plan[0] : p.plan
          const limit = plan?.api_limit_daily ?? 10
          const today = p.api_calls_today ?? 0
          return {
            email: p.email,
            today,
            limit,
            percent: Math.round((today / limit) * 100),
          }
        })
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5)

      setNearLimitUsers(near)

      setStats({
        totalUsers: total,
        activeUsers: active,
        apiCallsToday: apiToday,
        byPlan: Object.values(planMap).map((p) => ({
          ...p,
          color: PLAN_COLORS[p.name] ?? '#6b6b8a',
        })),
      })
    }

    // Recent audit logs
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (logs) setRecentLogs(logs as AuditLog[])

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const ACTION_LABELS: Partial<Record<string, string>> = {
    'account.created': 'Conta criada',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.login_failed': 'Login falhou',
    'user.created_by_admin': 'Usuário criado',
    'user.plan_changed': 'Plano alterado',
    'user.role_changed': 'Papel alterado',
    'user.access_toggled': 'Acesso alterado',
    'token.created': 'Token criado',
    'token.revoked': 'Token revogado',
    'api.limit_reached': 'Limite atingido',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#aa3bff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-[#aa3bff]" />
        <div>
          <h1 className="text-xl font-bold text-white">Visão Geral</h1>
          <p className="text-sm text-[#6b6b8a]">Painel de administração do AdCraft</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total de Usuários',
            value: stats.totalUsers,
            icon: Users,
            color: '#aa3bff',
            bg: 'rgba(170,59,255,0.1)',
          },
          {
            label: 'Usuários Ativos',
            value: stats.activeUsers,
            icon: Activity,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.1)',
          },
          {
            label: 'Calls de API Hoje',
            value: stats.apiCallsToday,
            icon: TrendingUp,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.1)',
          },
          {
            label: 'Perto do Limite',
            value: nearLimitUsers.length,
            icon: AlertTriangle,
            color: nearLimitUsers.length > 0 ? '#f59e0b' : '#6b6b8a',
            bg: nearLimitUsers.length > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(107,107,138,0.1)',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#6b6b8a] mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Users by plan */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Usuários por Plano</h3>
          {stats.byPlan.length === 0 ? (
            <p className="text-xs text-[#6b6b8a]">Nenhum dado</p>
          ) : (
            <div className="space-y-3">
              {stats.byPlan.map((plan) => {
                const pct = stats.totalUsers > 0
                  ? Math.round((plan.count / stats.totalUsers) * 100)
                  : 0
                return (
                  <div key={plan.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: plan.color }}>
                        {plan.display_name}
                      </span>
                      <span className="text-xs text-[#6b6b8a]">
                        {plan.count} usuário{plan.count !== 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: plan.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Near limit users */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            Usuários Perto do Limite
          </h3>
          {nearLimitUsers.length === 0 ? (
            <p className="text-xs text-[#6b6b8a]">Nenhum usuário perto do limite diário.</p>
          ) : (
            <div className="space-y-2.5">
              {nearLimitUsers.map((u) => (
                <div key={u.email} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c4c4d4] truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${u.percent}%`,
                            backgroundColor: u.percent >= 100 ? '#ef4444' : '#f59e0b',
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold shrink-0"
                        style={{ color: u.percent >= 100 ? '#ef4444' : '#f59e0b' }}
                      >
                        {u.today}/{u.limit}
                      </span>
                    </div>
                  </div>
                  <Badge variant={u.percent >= 100 ? 'error' : 'warning'}>
                    {u.percent}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent events */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Eventos Recentes</h3>
          <button
            onClick={() => navigate('/admin/auditoria')}
            className="flex items-center gap-1 text-xs text-[#aa3bff] hover:text-[#c4c4d4] transition-colors"
          >
            Ver todos
            <ExternalLink size={11} />
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-xs text-[#6b6b8a]">Nenhum evento registrado.</p>
        ) : (
          <div className="space-y-1">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-[#6b6b8a] shrink-0 font-mono">
                    {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-[#c4c4d4] truncate">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {log.actor_email && (
                    <span className="text-xs text-[#6b6b8a] truncate hidden sm:block">
                      {log.actor_email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={() => navigate('/admin/usuarios')}>
          <Plus size={14} />
          Criar Usuário
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/auditoria')}>
          <ExternalLink size={14} />
          Ver Logs
        </Button>
      </div>
    </div>
  )
}
