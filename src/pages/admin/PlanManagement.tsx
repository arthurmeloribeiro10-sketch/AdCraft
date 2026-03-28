import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Save,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getFeatureLabel, getPlanColor, getPlanBgColor } from '../../lib/planConfig'
import type { Plan, PlanFeatures } from '../../types/auth'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const BOOLEAN_FEATURES: (keyof PlanFeatures)[] = [
  'scriptGenerator',
  'copyGenerator',
  'videoAnalyzer',
  'creativeIdeas',
  'winnersLibrary',
  'trendsRadar',
  'projectHistory',
]

const NUMBER_FEATURES: (keyof PlanFeatures)[] = [
  'maxScripts',
  'maxCopies',
  'maxAnalyses',
  'maxIdeas',
]

interface PlanStats {
  planId: string
  userCount: number
  apiCallsToday: number
}

export default function PlanManagement() {
  const { profile: actorProfile } = useAuth()

  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<PlanStats[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPlan, setSavingPlan] = useState<string | null>(null)
  const [editForms, setEditForms] = useState<Record<string, Partial<Plan>>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    const { data: planData } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order')

    if (planData) {
      setPlans(planData as Plan[])
      const forms: Record<string, Partial<Plan>> = {}
      for (const p of planData) {
        forms[p.id] = {
          api_limit_daily: p.api_limit_daily,
          api_limit_monthly: p.api_limit_monthly,
          features: { ...p.features },
        }
      }
      setEditForms(forms)
    }
    setLoading(false)
  }, [])

  const loadStats = useCallback(async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('plan_id, api_calls_today')

    if (profileData) {
      const statsMap: Record<string, PlanStats> = {}
      for (const p of profileData) {
        if (!p.plan_id) continue
        if (!statsMap[p.plan_id]) {
          statsMap[p.plan_id] = { planId: p.plan_id, userCount: 0, apiCallsToday: 0 }
        }
        statsMap[p.plan_id].userCount++
        statsMap[p.plan_id].apiCallsToday += p.api_calls_today ?? 0
      }
      setStats(Object.values(statsMap))
    }
  }, [])

  useEffect(() => {
    loadPlans()
    loadStats()
  }, [loadPlans, loadStats])

  function updateForm(planId: string, key: keyof Partial<Plan>, value: unknown) {
    setEditForms((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [key]: value },
    }))
  }

  function updateFeature(planId: string, feature: keyof PlanFeatures, value: boolean | number) {
    setEditForms((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        features: {
          ...(prev[planId]?.features ?? {}),
          [feature]: value,
        } as PlanFeatures,
      },
    }))
  }

  async function savePlan(plan: Plan) {
    if (!actorProfile) return
    setSavingPlan(plan.id)

    const form = editForms[plan.id]
    const { error } = await supabase
      .from('plans')
      .update({
        api_limit_daily: form.api_limit_daily,
        api_limit_monthly: form.api_limit_monthly,
        features: form.features,
      })
      .eq('id', plan.id)

    setSavingPlan(null)
    if (!error) {
      setSaveSuccess(plan.id)
      setTimeout(() => setSaveSuccess(null), 2000)
      await loadPlans()
    }
  }

  const getPlanStat = (planId: string): PlanStats =>
    stats.find((s) => s.planId === planId) ?? { planId, userCount: 0, apiCallsToday: 0 }

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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <CreditCard size={20} className="text-[#aa3bff]" />
        <div>
          <h1 className="text-xl font-bold text-white">Gerenciamento de Planos</h1>
          <p className="text-sm text-[#6b6b8a]">Configure limites e recursos de cada plano</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const form = editForms[plan.id] ?? {}
          const planStat = getPlanStat(plan.id)
          const color = getPlanColor(plan.name)
          const bgColor = getPlanBgColor(plan.name)

          return (
            <Card key={plan.id} className="flex flex-col">
              {/* Plan header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                  >
                    <CreditCard size={16} style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color }}>{plan.display_name}</h3>
                    <p className="text-[10px] text-[#6b6b8a]">{plan.name}</p>
                  </div>
                </div>
                {saveSuccess === plan.id && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check size={12} />
                    Salvo!
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{planStat.userCount}</p>
                  <p className="text-[10px] text-[#6b6b8a]">Usuários</p>
                </div>
                <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-2.5 text-center">
                  <p className="text-lg font-bold text-white">{planStat.apiCallsToday}</p>
                  <p className="text-[10px] text-[#6b6b8a]">Calls hoje</p>
                </div>
              </div>

              {/* Limits */}
              <div className="flex flex-col gap-2.5 mb-5">
                <p className="text-xs font-semibold text-[#c4c4d4]">Limites de API</p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b6b8a]">Limite diário</label>
                    <input
                      type="number"
                      min={1}
                      value={form.api_limit_daily ?? plan.api_limit_daily}
                      onChange={(e) => updateForm(plan.id, 'api_limit_daily', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6b6b8a]">Limite mensal</label>
                    <input
                      type="number"
                      min={1}
                      value={form.api_limit_monthly ?? plan.api_limit_monthly}
                      onChange={(e) => updateForm(plan.id, 'api_limit_monthly', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 mb-5">
                <p className="text-xs font-semibold text-[#c4c4d4]">Recursos</p>
                {BOOLEAN_FEATURES.map((feat) => {
                  const val = (form.features as PlanFeatures)?.[feat] ?? plan.features[feat]
                  const isEnabled = Boolean(val)
                  return (
                    <div key={feat} className="flex items-center justify-between py-1">
                      <span className="text-xs text-[#6b6b8a]">{getFeatureLabel(feat)}</span>
                      <button
                        onClick={() => updateFeature(plan.id, feat, !isEnabled)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                          isEnabled
                            ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-emerald-400'
                            : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.15)] text-red-400'
                        }`}
                      >
                        {isEnabled ? <Check size={9} /> : <X size={9} />}
                        {isEnabled ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Number limits */}
              <div className="flex flex-col gap-2 mb-5">
                <p className="text-xs font-semibold text-[#c4c4d4]">Limites de Conteúdo</p>
                {NUMBER_FEATURES.map((feat) => {
                  const val = ((form.features as PlanFeatures)?.[feat] ?? plan.features[feat]) as number
                  return (
                    <div key={feat} className="flex items-center gap-2">
                      <label className="text-[10px] text-[#6b6b8a] flex-1">{getFeatureLabel(feat)}</label>
                      <input
                        type="number"
                        min={-1}
                        value={val}
                        onChange={(e) => updateFeature(plan.id, feat, Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-md outline-none focus:border-[rgba(170,59,255,0.5)] text-right"
                        title="-1 = ilimitado"
                      />
                    </div>
                  )
                })}
                <p className="text-[9px] text-[#6b6b8a]">-1 = ilimitado</p>
              </div>

              <Button
                onClick={() => savePlan(plan)}
                loading={savingPlan === plan.id}
                className="w-full mt-auto"
                variant="secondary"
              >
                <Save size={13} />
                Salvar Alterações
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Note about plan secrets */}
      <Card className="mt-6 border-[rgba(234,179,8,0.2)]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-400 mb-1">Segredos de plano</p>
            <p className="text-xs text-[#6b6b8a] leading-relaxed">
              Os segredos internos dos planos (chaves de API de serviços externos) são armazenados
              exclusivamente como variáveis de ambiente das Edge Functions do Supabase e nunca são
              expostos no frontend. Para atualizá-los, acesse o painel do Supabase → Edge Functions →
              Variáveis de Ambiente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
