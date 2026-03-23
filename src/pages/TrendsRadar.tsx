import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, RefreshCw, Zap, Radio, ChevronDown, ChevronUp,
  Copy, Target, Star, Lightbulb, Sparkles,
} from 'lucide-react'
import { generateTrends } from '../lib/ai'
import type { Trend } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ─── Score dots ────────────────────────────────────────────────────────────────

function ScoreDots({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{ backgroundColor: i < value ? color : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold ml-1" style={{ color }}>{value}/10</span>
    </div>
  )
}

// ─── Tipo badge variant map ────────────────────────────────────────────────────

const TIPO_VARIANT: Record<string, 'purple' | 'default' | 'warning'> = {
  copy: 'purple',
  visual: 'default',
  formato: 'warning',
}

const TIPO_GLOW: Record<string, string> = {
  copy: '#aa3bff',
  visual: '#22d3ee',
  formato: '#f59e0b',
}

// ─── Platform filter ───────────────────────────────────────────────────────────

const PLATAFORMAS = ['Todos', 'TikTok', 'Instagram', 'Facebook', 'YouTube', 'Multi-plataforma'] as const
type Plataforma = typeof PLATAFORMAS[number]

// ─── Trend card ────────────────────────────────────────────────────────────────

function TrendCard({ trend, index }: { trend: Trend; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const glow = TIPO_GLOW[trend.tipo] ?? '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
    >
      <Card className="p-4 relative overflow-hidden">
        {/* Background accent glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl pointer-events-none"
          style={{ background: glow, opacity: 0.07, transform: 'translate(40%, -40%)' }}
        />

        {/* Header row */}
        <div className="flex items-start gap-2 mb-3">
          <h4 className="text-sm font-bold text-white leading-snug flex-1">{trend.nome}</h4>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge variant={TIPO_VARIANT[trend.tipo] ?? 'default'}>{trend.tipo}</Badge>
            <Badge variant="default">{trend.plataforma}</Badge>
          </div>
        </div>

        {/* Score row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-[#aa3bff] shrink-0" />
            <span className="text-[10px] text-[#6b6b8a]">Viralidade</span>
            <ScoreDots value={trend.nivel_viralidade} color="#aa3bff" />
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={10} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] text-[#6b6b8a]">Conversão</span>
            <ScoreDots value={trend.potencial_conversao} color="#4ade80" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#6b6b8a] leading-relaxed mb-3">{trend.descricao}</p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#aa3bff] hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Recolher' : 'Ver estratégia completa'}
        </button>

        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-4"
          >
            {/* Por que viraliza */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={10} className="text-[#22d3ee]" />
                <span className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider">Por que viraliza</span>
              </div>
              <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.por_que_viraliza}</p>
            </div>

            {/* Como usar */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Star size={10} className="text-[#f59e0b]" />
                <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">Como usar em anúncios</span>
              </div>
              <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.como_usar}</p>
            </div>

            {/* Copy exemplo */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Copy size={10} className="text-[#aa3bff]" />
                <span className="text-[10px] font-bold text-[#aa3bff] uppercase tracking-wider">Copy pronto para usar</span>
              </div>
              <div className="bg-[rgba(170,59,255,0.08)] border border-[rgba(170,59,255,0.18)] rounded-lg p-3">
                <p className="text-xs text-[#c4c4d4] leading-relaxed italic">"{trend.copy_exemplo}"</p>
              </div>
            </div>

            {/* Ideia criativo */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={10} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ideia de criativo</span>
              </div>
              <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.ideia_criativo}</p>
            </div>

            {/* Inputs AdCraft */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={10} className="text-[#6366f1]" />
                <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider">Inputs sugeridos para AdCraft</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Produto', value: trend.inputs_adcraft.produto },
                  { label: 'Público', value: trend.inputs_adcraft.publico },
                  { label: 'Dor', value: trend.inputs_adcraft.dor },
                  { label: 'Promessa', value: trend.inputs_adcraft.promessa },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-lg p-2.5">
                    <span className="text-[9px] text-[#6b6b8a] uppercase tracking-wide font-medium">{label}</span>
                    <p className="text-[11px] text-[#c4c4d4] mt-0.5 leading-snug">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrendsRadar() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [plataforma, setPlataforma] = useState<Plataforma>('Todos')

  useEffect(() => {
    loadTrends()
  }, [])

  async function loadTrends() {
    setLoading(true)
    const data = await generateTrends()
    setTrends(data)
    setLastUpdate(new Date())
    setLoading(false)
  }

  const filtered =
    plataforma === 'Todos' ? trends : trends.filter((t) => t.plataforma === plataforma)

  const avgViralidade = trends.length
    ? Math.round(trends.reduce((s, t) => s + t.nivel_viralidade, 0) / trends.length)
    : 0
  const avgConversao = trends.length
    ? Math.round(trends.reduce((s, t) => s + t.potencial_conversao, 0) / trends.length)
    : 0
  const topTrend = trends.length
    ? trends.reduce((max, t) => (t.potencial_conversao > max.potencial_conversao ? t : max), trends[0])
    : null

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Radar de Tendências</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[#6b6b8a] text-sm">
                Tendências de criativos atualizadas diariamente por IA para escalar seus anúncios
              </p>
              <Badge variant="success" className="flex items-center gap-1 shrink-0">
                <Radio size={9} className="animate-pulse" />
                IA · Diário
              </Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={loadTrends} loading={loading} className="gap-2 shrink-0">
            <RefreshCw size={13} />
            Atualizar
          </Button>
        </div>
        <p className="text-[10px] text-[#6b6b8a] mt-2">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary metrics */}
          {trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-3"
            >
              <Card className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(170,59,255,0.12)] flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-[#aa3bff]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#6b6b8a]">Viralidade Média</p>
                  <p className="text-lg font-bold text-white leading-none mt-0.5">
                    {avgViralidade}<span className="text-xs text-[#6b6b8a] font-normal">/10</span>
                  </p>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.08)] flex items-center justify-center shrink-0">
                  <Target size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-[#6b6b8a]">Conversão Média</p>
                  <p className="text-lg font-bold text-white leading-none mt-0.5">
                    {avgConversao}<span className="text-xs text-[#6b6b8a] font-normal">/10</span>
                  </p>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center shrink-0">
                  <Star size={14} className="text-[#6366f1]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#6b6b8a]">Top Conversão</p>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    {topTrend?.nome ?? '—'}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Platform filter tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="flex gap-2 flex-wrap items-center"
          >
            {PLATAFORMAS.map((p) => (
              <button
                key={p}
                onClick={() => setPlataforma(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  plataforma === p
                    ? 'bg-[#aa3bff] text-white shadow-[0_0_14px_rgba(170,59,255,0.35)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                {p}
              </button>
            ))}
            {plataforma !== 'Todos' && (
              <span className="text-xs text-[#6b6b8a] pl-1">
                {filtered.length} tendência{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </motion.div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((trend, i) => (
                <TrendCard key={trend.id} trend={trend} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#6b6b8a]">
              <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma tendência para esta plataforma</p>
              <button
                onClick={() => setPlataforma('Todos')}
                className="text-xs text-[#aa3bff] mt-2 hover:underline"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
