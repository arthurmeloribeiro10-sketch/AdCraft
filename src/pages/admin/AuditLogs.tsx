import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { AuditLog, AuditAction } from '../../types/auth'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PAGE_SIZE = 20

const ACTION_LABELS: Record<AuditAction, string> = {
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
  'api_key.updated': 'Chave API atualizada',
  'api.called': 'API chamada',
  'api.limit_reached': 'Limite atingido',
  'profile.updated': 'Perfil atualizado',
  'password.changed': 'Senha alterada',
  'plan_key_validated': 'Chave de plano validada',
  'plan_key_failed': 'Chave de plano falhou',
  'plan_key_rotated': 'Chave de plano rotacionada',
  'email_blocked': 'Email bloqueado',
}

type ActionColor = 'blue' | 'gray' | 'green' | 'yellow' | 'red' | 'purple' | 'default'

const ACTION_COLORS: Partial<Record<AuditAction, ActionColor>> = {
  'auth.login': 'blue',
  'auth.logout': 'gray',
  'account.created': 'green',
  'user.created_by_admin': 'green',
  'user.plan_changed': 'yellow',
  'user.role_changed': 'yellow',
  'user.access_toggled': 'yellow',
  'token.created': 'purple',
  'token.revoked': 'red',
  'auth.login_failed': 'red',
  'api.limit_reached': 'red',
  'api_key.updated': 'purple',
}

const COLOR_CLASSES: Record<ActionColor, string> = {
  blue: 'bg-[rgba(59,130,246,0.1)] text-blue-400 border-[rgba(59,130,246,0.2)]',
  gray: 'bg-[rgba(107,107,138,0.1)] text-[#6b6b8a] border-[rgba(107,107,138,0.2)]',
  green: 'bg-[rgba(34,197,94,0.1)] text-emerald-400 border-[rgba(34,197,94,0.2)]',
  yellow: 'bg-[rgba(234,179,8,0.1)] text-yellow-400 border-[rgba(234,179,8,0.2)]',
  red: 'bg-[rgba(239,68,68,0.1)] text-red-400 border-[rgba(239,68,68,0.2)]',
  purple: 'bg-[rgba(170,59,255,0.1)] text-[#aa3bff] border-[rgba(170,59,255,0.25)]',
  default: 'bg-[rgba(255,255,255,0.06)] text-[#c4c4d4] border-[rgba(255,255,255,0.1)]',
}

function ActionBadge({ action }: { action: AuditAction }) {
  const color = ACTION_COLORS[action] ?? 'default'
  const label = ACTION_LABELS[action] ?? action
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${COLOR_CLASSES[color]}`}>
      {label}
    </span>
  )
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [searchEmail, setSearchEmail] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (searchEmail) {
      query = query.ilike('actor_email', `%${searchEmail}%`)
    }
    if (filterAction) {
      query = query.eq('action', filterAction)
    }
    if (filterDateFrom) {
      query = query.gte('created_at', filterDateFrom)
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('created_at', toDate.toISOString())
    }

    try {
      const { data, count } = await query
      if (data) {
        setLogs(data as AuditLog[])
        setTotal(count ?? 0)
      }
    } catch (err) {
      console.error('loadLogs error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchEmail, filterAction, filterDateFrom, filterDateTo])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    setPage(0)
  }, [searchEmail, filterAction, filterDateFrom, filterDateTo])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadLogs, 30000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, loadLogs])

  function exportCsv() {
    const headers = ['Data', 'Ator', 'Email', 'Ação', 'Recurso', 'ID Recurso', 'IP', 'Detalhes']
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.actor_id ?? '',
      log.actor_email ?? '',
      log.action,
      log.resource_type ?? '',
      log.resource_id ?? '',
      log.ip_address ?? '',
      JSON.stringify(log.metadata),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-[#aa3bff]" />
          <div>
            <h1 className="text-xl font-bold text-white">Logs de Auditoria</h1>
            <p className="text-sm text-[#6b6b8a]">{total} registro{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
              autoRefresh
                ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-emerald-400'
                : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#6b6b8a] hover:text-[#c4c4d4]'
            }`}
          >
            <RefreshCw size={11} className={autoRefresh ? 'animate-spin' : ''} />
            Auto-refresh (30s)
          </button>
          <Button variant="secondary" onClick={loadLogs}>
            <RefreshCw size={13} />
            Atualizar
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={13} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-40 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a]" />
            <input
              type="text"
              placeholder="Buscar por email do ator..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)] placeholder:text-[#6b6b8a]"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
          >
            <option value="">Todas as ações</option>
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <option key={action} value={action}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
            title="Data de início"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
            title="Data de fim"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#aa3bff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6b6b8a]">
            <FileText size={32} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum log encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(170,59,255,0.08)]">
                    {['Data', 'Ator / Email', 'Ação', 'Recurso', 'IP', 'Detalhes', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(170,59,255,0.03)] transition-colors">
                        <td className="px-4 py-3 text-xs text-[#6b6b8a] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-[#c4c4d4]">{log.actor_email ?? '—'}</p>
                          {log.actor_id && (
                            <p className="text-[9px] text-[#6b6b8a] mt-0.5 font-mono">
                              {log.actor_id.slice(0, 8)}...
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3">
                          {log.resource_type && (
                            <span className="text-xs text-[#6b6b8a]">
                              {log.resource_type}
                              {log.resource_id && (
                                <span className="ml-1 font-mono text-[9px]">
                                  #{log.resource_id.slice(0, 6)}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b6b8a] font-mono">
                          {log.ip_address ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b6b8a] max-w-32 truncate">
                          {Object.keys(log.metadata ?? {}).length > 0
                            ? JSON.stringify(log.metadata).slice(0, 40) + '...'
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {Object.keys(log.metadata ?? {}).length > 0 && (
                            <button
                              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                              className="p-1 rounded text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
                            >
                              {expandedId === log.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="border-b border-[rgba(255,255,255,0.03)]">
                          <td colSpan={7} className="px-4 py-3 bg-[rgba(170,59,255,0.03)]">
                            <pre className="text-xs text-[#c4c4d4] font-mono bg-[rgba(0,0,0,0.3)] p-3 rounded-lg overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(170,59,255,0.08)]">
                <span className="text-xs text-[#6b6b8a]">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-md text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 py-1 text-xs text-[#6b6b8a]">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-md text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
