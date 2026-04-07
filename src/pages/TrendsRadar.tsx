import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, RefreshCw, Zap, Radio, ChevronDown, ChevronUp,
  Copy, Target, Star, Lightbulb, Sparkles, FileText, PenLine,
  Check, Save, BookOpen, ArrowRight,
} from 'lucide-react'
import { generateTrends, generateTrendScript, generateTrendCopy } from '../lib/ai'
import type { Trend } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ─── Local persistence ────────────────────────────────────────────────────────

const SAVES_KEY = 'adcraft_trend_saves'
const TRENDS_CACHE_KEY = 'adcraft_trends_cache'

interface TrendsCache {
  trends: Trend[]
  date: string // YYYY-MM-DD
}

function loadTrendsCache(): TrendsCache | null {
  try {
    const raw = localStorage.getItem(TRENDS_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TrendsCache
  } catch {
    return null
  }
}

function saveTrendsCache(trends: Trend[]) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const cache: TrendsCache = { trends, date: today }
    localStorage.setItem(TRENDS_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

function isCacheFresh(cache: TrendsCache): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return cache.date === today
}

function loadAllSaves(): Record<string, { roteiro?: string; copy?: string; savedAt?: string }> {
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistSave(trendId: string, type: 'roteiro' | 'copy', content: string) {
  try {
    const all = loadAllSaves()
    all[trendId] = { ...all[trendId], [type]: content, savedAt: new Date().toISOString() }
    localStorage.setItem(SAVES_KEY, JSON.stringify(all))
  } catch {}
}

// ─── Score dots ───────────────────────────────────────────────────────────────

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

// ─── Badge / glow maps ────────────────────────────────────────────────────────

const TIPO_VARIANT: Record<string, 'purple' | 'default' | 'warning'> = {
  copy: 'purple', visual: 'default', formato: 'warning',
}
const TIPO_GLOW: Record<string, string> = {
  copy: '#aa3bff', visual: '#22d3ee', formato: '#f59e0b',
}

// ─── Platform filter ──────────────────────────────────────────────────────────

const PLATAFORMAS = ['Todos', 'TikTok', 'Instagram', 'Facebook', 'YouTube', 'Multi-plataforma'] as const
type Plataforma = typeof PLATAFORMAS[number]

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'estrategia' | 'roteiro' | 'copy'

// ─── Editable textarea block ──────────────────────────────────────────────────

interface EditableBlockProps {
  label: string
  value: string
  onChange: (v: string) => void
  savedIndicator: boolean
  rows?: number
}

function EditableBlock({ label, value, onChange, savedIndicator, rows = 14 }: EditableBlockProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#6b6b8a] uppercase tracking-wider flex items-center gap-1.5">
          <PenLine size={9} />
          {label} — editável
        </span>
        {savedIndicator && (
          <span
            className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium"
            style={{ animation: 'fadeIn 0.15s ease' }}
          >
            <Check size={9} />
            Salvo automaticamente
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 text-xs text-[#c4c4d4] leading-relaxed resize-y outline-none focus:border-[rgba(170,59,255,0.4)] focus:bg-[rgba(170,59,255,0.03)] transition-all font-mono placeholder-[#6b6b8a]"
        placeholder="Conteúdo gerado aparecerá aqui. Você pode editar livremente antes de usar."
      />
    </div>
  )
}

// ─── Generating spinner ───────────────────────────────────────────────────────

function GeneratingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-8 h-8 border-2 border-[#aa3bff] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-[#c4c4d4] text-center">{label}</p>
      <div className="flex gap-1.5">
        {(['#aa3bff', '#6366f1', '#22d3ee'] as const).map((color, i) => (
          <div
            key={color}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── TrendCard ────────────────────────────────────────────────────────────────

function TrendCard({ trend, index }: { trend: Trend; index: number }) {
  const glow = TIPO_GLOW[trend.tipo] ?? '#6366f1'

  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('estrategia')

  const [scriptContent, setScriptContent] = useState('')
  const [copyContent, setCopyContent] = useState('')
  const [scriptGenerated, setScriptGenerated] = useState(false)
  const [copyGenerated, setCopyGenerated] = useState(false)

  const [generatingScript, setGeneratingScript] = useState(false)
  const [generatingCopy, setGeneratingCopy] = useState(false)

  const [savedScript, setSavedScript] = useState(false)
  const [savedCopy, setSavedCopy] = useState(false)
  const debounceScript = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceCopy = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandedRef = useRef<HTMLDivElement>(null)

  // Restore saved content on mount
  useEffect(() => {
    const all = loadAllSaves()
    const saved = all[trend.id]
    if (saved?.roteiro) { setScriptContent(saved.roteiro); setScriptGenerated(true) }
    if (saved?.copy) { setCopyContent(saved.copy); setCopyGenerated(true) }
  }, [trend.id])

  // Auto-save script (debounced 1.5s)
  const handleScriptChange = useCallback((v: string) => {
    setScriptContent(v)
    if (debounceScript.current) clearTimeout(debounceScript.current)
    debounceScript.current = setTimeout(() => {
      persistSave(trend.id, 'roteiro', v)
      setSavedScript(true)
      setTimeout(() => setSavedScript(false), 2500)
    }, 1500)
  }, [trend.id])

  // Auto-save copy (debounced 1.5s)
  const handleCopyChange = useCallback((v: string) => {
    setCopyContent(v)
    if (debounceCopy.current) clearTimeout(debounceCopy.current)
    debounceCopy.current = setTimeout(() => {
      persistSave(trend.id, 'copy', v)
      setSavedCopy(true)
      setTimeout(() => setSavedCopy(false), 2500)
    }, 1500)
  }, [trend.id])

  async function doGenerateScript() {
    if (generatingScript) return
    setGeneratingScript(true)
    try {
      const result = await generateTrendScript(trend)
      setScriptContent(result)
      setScriptGenerated(true)
      persistSave(trend.id, 'roteiro', result)
      setSavedScript(true)
      setTimeout(() => setSavedScript(false), 2500)
    } finally {
      setGeneratingScript(false)
    }
  }

  async function doGenerateCopy() {
    if (generatingCopy) return
    setGeneratingCopy(true)
    try {
      const result = await generateTrendCopy(trend)
      setCopyContent(result)
      setCopyGenerated(true)
      persistSave(trend.id, 'copy', result)
      setSavedCopy(true)
      setTimeout(() => setSavedCopy(false), 2500)
    } finally {
      setGeneratingCopy(false)
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'roteiro' && !scriptGenerated && !generatingScript) doGenerateScript()
    if (tab === 'copy' && !copyGenerated && !generatingCopy) doGenerateCopy()
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: 'estrategia', label: 'Estratégia', icon: <BookOpen size={10} /> },
    { id: 'roteiro', label: 'Roteiro', icon: <FileText size={10} />, badge: scriptGenerated },
    { id: 'copy', label: 'Copy', icon: <Copy size={10} />, badge: copyGenerated },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      whileHover={expanded ? undefined : { y: -2 }}
    >
      <Card className="p-4 relative">
        {/* Background accent glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl pointer-events-none"
          style={{ background: glow, opacity: 0.07, transform: 'translate(40%,-40%)' }}
        />

        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <h4 className="text-sm font-bold text-white leading-snug flex-1">{trend.nome}</h4>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge variant={TIPO_VARIANT[trend.tipo] ?? 'default'}>{trend.tipo}</Badge>
            <Badge variant="default">{trend.plataforma}</Badge>
          </div>
        </div>

        {/* Scores */}
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
          onClick={() => {
            if (!expanded) {
              setExpanded(true)
              setActiveTab('estrategia')
              setTimeout(() => {
                expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }, 50)
            } else {
              setExpanded(false)
            }
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#aa3bff] hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Recolher' : 'Ver estratégia completa'}
        </button>

        {/* ── Expanded section ── */}
        {expanded && (
          <div ref={expandedRef} style={{ animation: 'fadeIn 0.15s ease' }}>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">

                {/* Tab bar */}
                <div className="flex gap-1 mb-4 bg-[rgba(255,255,255,0.03)] rounded-lg p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex-1 relative flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[11px] font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-[rgba(170,59,255,0.2)] text-[#aa3bff] shadow-[0_0_12px_rgba(170,59,255,0.15)]'
                          : 'text-[#6b6b8a] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.badge && (
                        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Estratégia tab ── */}
                {activeTab === 'estrategia' && (
                  <div className="space-y-4" style={{ animation: 'fadeIn 0.15s ease' }}>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Zap size={10} className="text-[#22d3ee]" />
                        <span className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider">Por que viraliza</span>
                      </div>
                      <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.por_que_viraliza}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Star size={10} className="text-[#f59e0b]" />
                        <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">Como usar em anúncios</span>
                      </div>
                      <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.como_usar}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Copy size={10} className="text-[#aa3bff]" />
                        <span className="text-[10px] font-bold text-[#aa3bff] uppercase tracking-wider">Copy pronta para usar</span>
                      </div>
                      <div className="bg-[rgba(170,59,255,0.08)] border border-[rgba(170,59,255,0.18)] rounded-xl p-3">
                        <p className="text-xs text-[#c4c4d4] leading-relaxed italic">"{trend.copy_exemplo}"</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb size={10} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ideia de criativo</span>
                      </div>
                      <p className="text-xs text-[#c4c4d4] leading-relaxed">{trend.ideia_criativo}</p>
                    </div>

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

                    {/* Action CTAs */}
                    <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTabChange('roteiro')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[rgba(170,59,255,0.15)] hover:bg-[rgba(170,59,255,0.25)] border border-[rgba(170,59,255,0.25)] rounded-lg px-3 py-2 transition-all"
                      >
                        <FileText size={11} />
                        {scriptGenerated ? 'Ver roteiro' : 'Gerar roteiro'}
                        <ArrowRight size={10} />
                      </button>
                      <button
                        onClick={() => handleTabChange('copy')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[rgba(99,102,241,0.15)] hover:bg-[rgba(99,102,241,0.25)] border border-[rgba(99,102,241,0.25)] rounded-lg px-3 py-2 transition-all"
                      >
                        <Copy size={11} />
                        {copyGenerated ? 'Ver copy' : 'Gerar copy'}
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Roteiro tab ── */}
                {activeTab === 'roteiro' && (
                  <div style={{ animation: 'fadeIn 0.15s ease' }}>
                    {generatingScript ? (
                      <GeneratingSpinner label="Gerando roteiro personalizado para esta tendência…" />
                    ) : scriptGenerated ? (
                      <EditableBlock
                        label="Roteiro"
                        value={scriptContent}
                        onChange={handleScriptChange}
                        savedIndicator={savedScript}
                        rows={16}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(170,59,255,0.1)] border border-[rgba(170,59,255,0.2)] flex items-center justify-center">
                          <FileText size={22} className="text-[#aa3bff]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-white mb-1">Gerar roteiro completo</p>
                          <p className="text-xs text-[#6b6b8a] max-w-[260px]">Hook, Problema, Solução, Prova e CTA estruturados para esta tendência</p>
                        </div>
                        <Button variant="primary" onClick={doGenerateScript} className="gap-2">
                          <Zap size={13} />
                          Gerar roteiro agora
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Copy tab ── */}
                {activeTab === 'copy' && (
                  <div style={{ animation: 'fadeIn 0.15s ease' }}>
                    {generatingCopy ? (
                      <GeneratingSpinner label="Gerando 2 variações de copy para esta tendência…" />
                    ) : copyGenerated ? (
                      <EditableBlock
                        label="Copy (2 variações)"
                        value={copyContent}
                        onChange={handleCopyChange}
                        savedIndicator={savedCopy}
                        rows={18}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
                          <Copy size={22} className="text-[#6366f1]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-white mb-1">Gerar copies de conversão</p>
                          <p className="text-xs text-[#6b6b8a] max-w-[260px]">2 variações prontas: emocional e direta/oferta com foco em performance</p>
                        </div>
                        <Button variant="primary" onClick={doGenerateCopy} className="gap-2">
                          <Sparkles size={13} />
                          Gerar copies agora
                        </Button>
                      </div>
                    )}
                  </div>
                )}

              </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ─── Saves indicator ──────────────────────────────────────────────────────────

function SavesCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const all = loadAllSaves()
    let total = 0
    for (const v of Object.values(all)) {
      if (v.roteiro) total++
      if (v.copy) total++
    }
    setCount(total)
  }, [])
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.15)] rounded-full px-2 py-0.5">
      <Save size={9} />
      {count} item{count !== 1 ? 's' : ''} salvo{count !== 1 ? 's' : ''}
    </span>
  )
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

function SummaryMetrics({ trends }: { trends: Trend[] }) {
  if (trends.length === 0) return null
  const avgViral = Math.round(trends.reduce((s, t) => s + t.nivel_viralidade, 0) / trends.length)
  const avgConv = Math.round(trends.reduce((s, t) => s + t.potencial_conversao, 0) / trends.length)
  const top = trends.reduce((max, t) => (t.potencial_conversao > max.potencial_conversao ? t : max), trends[0])
  return (
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
            {avgViral}<span className="text-xs text-[#6b6b8a] font-normal">/10</span>
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
            {avgConv}<span className="text-xs text-[#6b6b8a] font-normal">/10</span>
          </p>
        </div>
      </Card>
      <Card className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center shrink-0">
          <Star size={14} className="text-[#6366f1]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-[#6b6b8a]">Top Conversão</p>
          <p className="text-xs font-bold text-white truncate mt-0.5">{top.nome}</p>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(170,59,255,0.15)]" />
        <div className="absolute inset-0 rounded-full border-2 border-[#aa3bff] border-t-transparent animate-spin" />
        <TrendingUp size={22} className="text-[#aa3bff]" />
      </div>

      <div className="text-center max-w-xs px-4">
        <p className="text-sm font-semibold text-white mb-1.5">Aguarde…</p>
        <p className="text-sm text-[#c4c4d4] leading-relaxed">
          Em poucos instantes vamos montar as tendências mais atualizadas para você.
        </p>
      </div>

      <div className="flex gap-2">
        {(['#aa3bff', '#6366f1', '#22d3ee'] as const).map((color, i) => (
          <div
            key={color}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: `${i * 130}ms` }}
          />
        ))}
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-44 rounded-xl" style={{ opacity: 0.4 + i * 0.05 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrendsRadar() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [plataforma, setPlataforma] = useState<Plataforma>('Todos')

  useEffect(() => {
    const cache = loadTrendsCache()
    if (cache && isCacheFresh(cache)) {
      setTrends(cache.trends)
      setLastUpdate(new Date(`${cache.date}T00:00:00`))
      setFromCache(true)
    } else {
      loadTrends()
    }
  }, [])

  async function loadTrends() {
    setLoading(true)
    setFromCache(false)
    const data = await generateTrends()
    setTrends(data)
    saveTrendsCache(data)
    setLastUpdate(new Date())
    setLoading(false)
  }

  const filtered = plataforma === 'Todos' ? trends : trends.filter((t) => t.plataforma === plataforma)

  const platformCounts = trends.reduce<Record<string, number>>((acc, t) => {
    acc[t.plataforma] = (acc[t.plataforma] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Radar de Tendências</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[#6b6b8a] text-sm">
                Tendências atualizadas diariamente por IA para escalar seus anúncios
              </p>
              <Badge variant="success" className="flex items-center gap-1 shrink-0">
                <Radio size={9} className="animate-pulse" />
                IA · Diário
              </Badge>
              <SavesCount />
            </div>
          </div>
          <Button variant="secondary" onClick={loadTrends} loading={loading} className="gap-2 shrink-0">
            <RefreshCw size={13} />
            Atualizar
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-[10px] text-[#6b6b8a] mt-2">
            {fromCache
              ? `Tendências de hoje · próxima atualização amanhã`
              : `Última atualização: ${lastUpdate.toLocaleString('pt-BR')}`}
          </p>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="space-y-5" style={{ animation: 'fadeIn 0.2s ease' }}>
          <SummaryMetrics trends={trends} />

            {trends.length > 0 && (
              <div className="flex gap-2 flex-wrap items-center">
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
                    {p !== 'Todos' && platformCounts[p] ? (
                      <span className="ml-1 text-[9px] opacity-60">({platformCounts[p]})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((trend, i) => (
                  <TrendCard key={trend.id} trend={trend} index={i} />
                ))}
              </div>
            ) : trends.length > 0 ? (
              <div className="text-center py-16 text-[#6b6b8a]">
                <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma tendência para esta plataforma</p>
                <button onClick={() => setPlataforma('Todos')} className="text-xs text-[#aa3bff] mt-2 hover:underline">
                  Ver todas
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-[#6b6b8a]">
                <TrendingUp size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-3">Nenhuma tendência carregada</p>
                <Button variant="secondary" onClick={loadTrends} className="gap-2">
                  <RefreshCw size={13} />
                  Carregar tendências
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
