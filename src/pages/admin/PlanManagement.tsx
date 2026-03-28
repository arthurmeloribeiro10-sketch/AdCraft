import { useState, useEffect, useCallback } from 'react'
import { Key, RefreshCw, Shield, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, Calendar, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { adminGetPlanKeyStatus, adminSetPlanKey } from '../../lib/planKey'
import type { PlanKeyStatus } from '../../lib/planKey'
import type { Plan } from '../../types/auth'

const PLAN_COLORS: Record<string, string> = {
  starter: '#6b6b8a',
  pro: '#6366f1',
  elite: '#aa3bff',
}

export default function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [planKeys, setPlanKeys] = useState<PlanKeyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  // Plan key modal state
  const [keyModal, setKeyModal] = useState<{ open: boolean; planName: string; planDisplay: string } | null>(null)
  const [newKey, setNewKey] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [keyExpiresAt, setKeyExpiresAt] = useState('')
  const [keyNotes, setKeyNotes] = useState('')
  const [keySaving, setKeySaving] = useState(false)
  const [keyError, setKeyError] = useState('')

  // Feature limits state
  const [editedPlans, setEditedPlans] = useState<Record<string, Partial<Plan>>>({})
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: plansData }, keysData] = await Promise.all([
        supabase.from('plans').select('*').order('sort_order'),
        adminGetPlanKeyStatus(),
      ])
      setPlans(plansData || [])
      setPlanKeys(keysData)
    } catch (err) {
      console.error('PlanManagement loadData:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openKeyModal = (planName: string, planDisplay: string) => {
    setKeyModal({ open: true, planName, planDisplay })
    setNewKey('')
    setKeyExpiresAt('')
    setKeyNotes('')
    setKeyError('')
    setShowNewKey(false)
  }

  const handleSetPlanKey = async () => {
    if (!keyModal) return
    if (newKey.length < 8) { setKeyError('A chave deve ter pelo menos 8 caracteres.'); return }
    setKeySaving(true)
    setKeyError('')
    try {
      const result = await adminSetPlanKey(
        keyModal.planName,
        newKey,
        keyExpiresAt || null,
        keyNotes || null
      )
      if (!result.success) { setKeyError(result.error || 'Erro ao salvar chave.'); return }
      setKeyModal(null)
      await loadData()
      setSuccess('Chave do plano atualizada com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setKeySaving(false)
    }
  }

  const handleSavePlanFeatures = async (planId: string) => {
    const edits = editedPlans[planId]
    if (!edits) return
    setSaving(planId)
    try {
      await supabase.from('plans').update(edits).eq('id', planId)
      setSuccess('Configurações salvas!')
      setTimeout(() => setSuccess(''), 3000)
      await loadData()
      setEditedPlans(prev => { const n = { ...prev }; delete n[planId]; return n })
    } finally {
      setSaving(null)
    }
  }

  const updateFeature = (planId: string, key: string, value: boolean | number) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return
    const currentFeatures = plan.features || {}
    setEditedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        features: { ...currentFeatures, ...(prev[planId]?.features as object || {}), [key]: value }
      }
    }))
  }

  const updateLimit = (planId: string, field: 'api_limit_daily' | 'api_limit_monthly', value: number) => {
    setEditedPlans(prev => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }))
  }

  const getKeyStatus = (planName: string) => planKeys.find(k => k.plan_name === planName)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#aa3bff', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Gerenciamento de Planos</h1>
        <p className="mt-1 text-sm" style={{ color: '#6b6b8a' }}>Configure planos, funcionalidades e chaves de acesso</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80' }}>
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* ── PLAN KEYS SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" style={{ color: '#aa3bff' }} />
          <h2 className="text-lg font-semibold text-white">Chaves de Acesso por Plano</h2>
        </div>
        <p className="mb-4 text-sm" style={{ color: '#6b6b8a' }}>
          Cada plano tem uma chave secreta. Os usuários inserem essa chave no cadastro para ativar o plano correspondente.
          As chaves são armazenadas com hash bcrypt — nunca expostas.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map(plan => {
            const keyStatus = getKeyStatus(plan.name)
            const hasKey = keyStatus?.has_active_key ?? false
            const isExpired = keyStatus?.is_expired ?? false
            const expiresAt = keyStatus?.expires_at
            const color = PLAN_COLORS[plan.name] || '#6b6b8a'

            return (
              <div key={plan.id} className="rounded-xl border p-5 space-y-4" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${color}22`, color }}>
                      {plan.display_name}
                    </span>
                  </div>
                  {hasKey && !isExpired && <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />}
                  {isExpired && <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />}
                  {!hasKey && <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${hasKey && !isExpired ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs" style={{ color: '#6b6b8a' }}>
                      {!hasKey ? 'Sem chave ativa' : isExpired ? 'Chave expirada' : 'Chave ativa'}
                    </span>
                  </div>
                  {expiresAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" style={{ color: '#6b6b8a' }} />
                      <span className="text-xs" style={{ color: '#6b6b8a' }}>
                        Expira: {new Date(expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {!expiresAt && hasKey && (
                    <span className="text-xs" style={{ color: '#6b6b8a' }}>Sem expiração</span>
                  )}
                </div>

                <button
                  onClick={() => openKeyModal(plan.name, plan.display_name)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                >
                  <Key className="w-3.5 h-3.5" />
                  {hasKey ? 'Trocar chave' : 'Definir chave'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── PLAN FEATURES SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5" style={{ color: '#6366f1' }} />
          <h2 className="text-lg font-semibold text-white">Funcionalidades por Plano</h2>
        </div>

        <div className="space-y-3">
          {plans.map(plan => {
            const edits = editedPlans[plan.id] || {}
            const features = { ...(plan.features || {}), ...(edits.features as object || {}) }
            const isExpanded = expandedPlan === plan.id
            const color = PLAN_COLORS[plan.name] || '#6b6b8a'
            const hasChanges = !!editedPlans[plan.id]

            const boolFeatures: [string, string][] = [
              ['scriptGenerator', 'Gerador de Roteiros'],
              ['copyGenerator', 'Gerador de Copy'],
              ['videoAnalyzer', 'Análise de Vídeo'],
              ['creativeIdeas', 'Ideias Criativas'],
              ['winnersLibrary', 'Biblioteca de Winners'],
              ['trendsRadar', 'Radar de Tendências'],
              ['projectHistory', 'Histórico de Projetos'],
            ]

            const numFeatures: [string, string][] = [
              ['maxScripts', 'Máx. Roteiros'],
              ['maxCopies', 'Máx. Copies'],
              ['maxAnalyses', 'Máx. Análises'],
              ['maxIdeas', 'Máx. Ideias'],
            ]

            return (
              <div key={plan.id} className="rounded-xl border overflow-hidden" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold px-2.5 py-1 rounded-full" style={{ background: `${color}22`, color }}>
                      {plan.display_name}
                    </span>
                    {hasChanges && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>Não salvo</span>}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: '#6b6b8a' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#6b6b8a' }} />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: '#1a1a2e' }}>
                    {/* API Limits */}
                    <div className="pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b8a' }}>Limite diário de API</label>
                        <input type="number"
                          value={(edits as { api_limit_daily?: number }).api_limit_daily ?? plan.api_limit_daily}
                          onChange={e => updateLimit(plan.id, 'api_limit_daily', +e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b8a' }}>Limite mensal de API</label>
                        <input type="number"
                          value={(edits as { api_limit_monthly?: number }).api_limit_monthly ?? plan.api_limit_monthly}
                          onChange={e => updateLimit(plan.id, 'api_limit_monthly', +e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                        />
                      </div>
                    </div>

                    {/* Boolean features */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Funcionalidades</p>
                      {boolFeatures.map(([key, label]) => (
                        <label key={key} className="flex items-center justify-between py-1.5">
                          <span className="text-sm" style={{ color: '#c4c4d4' }}>{label}</span>
                          <div
                            onClick={() => updateFeature(plan.id, key, !(features as unknown as Record<string, boolean>)[key])}
                            className="w-10 h-5 rounded-full cursor-pointer transition-colors relative"
                            style={{ background: (features as unknown as Record<string, boolean>)[key] ? '#aa3bff' : '#1a1a2e' }}
                          >
                            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                              style={{ left: (features as unknown as Record<string, boolean>)[key] ? '1.375rem' : '0.125rem' }} />
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Numeric limits */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Limites numéricos (-1 = ilimitado)</p>
                      <div className="grid grid-cols-2 gap-3">
                        {numFeatures.map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-xs mb-1" style={{ color: '#6b6b8a' }}>{label}</label>
                            <input type="number"
                              value={(features as unknown as Record<string, number>)[key] ?? -1}
                              onChange={e => updateFeature(plan.id, key, +e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                              style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSavePlanFeatures(plan.id)}
                      disabled={saving === plan.id || !hasChanges}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      style={{ background: '#aa3bff22', color: '#aa3bff', border: '1px solid #aa3bff44' }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving === plan.id ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── PLAN KEY MODAL ── */}
      {keyModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
            <div>
              <h3 className="text-lg font-semibold text-white">Chave do plano {keyModal.planDisplay}</h3>
              <p className="mt-1 text-sm" style={{ color: '#6b6b8a' }}>
                A nova chave será armazenada com hash bcrypt. A chave anterior será invalidada imediatamente.
              </p>
            </div>

            {keyError && (
              <div className="px-4 py-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
                {keyError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Nova chave do plano</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    value={newKey} onChange={e => setNewKey(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                  />
                  <button type="button" onClick={() => setShowNewKey(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b8a' }}>
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>
                  Data de expiração
                  <span className="ml-1 text-xs" style={{ color: '#6b6b8a' }}>(opcional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input type="datetime-local"
                    value={keyExpiresAt} onChange={e => setKeyExpiresAt(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>
                  Observações
                  <span className="ml-1 text-xs" style={{ color: '#6b6b8a' }}>(opcional)</span>
                </label>
                <input type="text"
                  value={keyNotes} onChange={e => setKeyNotes(e.target.value)}
                  placeholder="ex: Renovação mensal março/2025"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setKeyModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{ borderColor: '#1a1a2e', color: '#6b6b8a' }}>
                Cancelar
              </button>
              <button onClick={handleSetPlanKey} disabled={keySaving || newKey.length < 8}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)', color: '#fff' }}>
                {keySaving ? 'Salvando...' : 'Salvar chave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
