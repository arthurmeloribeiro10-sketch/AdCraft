import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, Sparkles, ChevronDown, Filter,
  Target, TrendingUp, DollarSign, Users, Zap, Copy, CheckCheck,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import type { LibraryAd } from '../types'
import { searchAdLibrary } from '../lib/ai'
import { consumeTokens, tokenLimitMessage } from '../lib/tokens'
import { useAuth } from '../context/AuthContext'

// ─── Default examples (shown before any search) ──────────────────────────────

const DEFAULT_ADS: LibraryAd[] = [
  {
    id: '1',
    creative_type: 'UGC Testemunho',
    niche: 'Emagrecimento',
    format: 'Vertical 9:16',
    platform: 'TikTok',
    structure: 'Hook visual (0-3s) → Problema pessoal (3-8s) → Descoberta (8-15s) → Resultado (15-25s) → CTA (25-30s)',
    strategy: 'Prova Social + Urgência',
    why_works: 'A narrativa em primeira pessoa cria identificação imediata. O resultado mostrado antes do CTA elimina objeções antes que apareçam. A linguagem casual e autêntica eleva a credibilidade.',
    hook_example: '"Eu tentei tudo e nada funcionava... até eu descobrir isso."',
    copy_example: 'Perdi 8kg em 45 dias sem academia e sem passar fome. O segredo? Um método simples que a maioria ignora. Link na bio 👇',
    target_audience: 'Mulheres 25-45 anos, que já tentaram outras dietas sem sucesso, público morno/quente',
    difficulty: 'Fácil',
    estimated_ctr: '3-6%',
    budget_range: 'R$30-80/dia',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    creative_type: 'Tutorial Rápido',
    niche: 'Marketing Digital',
    format: 'Vertical 9:16',
    platform: 'Instagram',
    structure: 'Hook pergunta (0-3s) → Promessa clara (3-6s) → Passo 1 (6-12s) → Passo 2 (12-18s) → Resultado (18-24s) → CTA (24-30s)',
    strategy: 'Educação + Autoridade',
    why_works: 'O formato tutorial posiciona o criador como autoridade. A estrutura numerada mantém o espectador até o fim esperando o próximo passo. Alta taxa de salvamento = mais alcance orgânico.',
    hook_example: '"Você ainda está fazendo anúncios no jeito errado? Olha isso."',
    copy_example: 'Em 3 passos você transforma um anúncio comum em máquina de vendas. Salva esse post antes de perder. 💾',
    target_audience: 'Empreendedores e gestores de tráfego 22-40 anos, público frio a morno',
    difficulty: 'Médio',
    estimated_ctr: '2-4%',
    budget_range: 'R$50-150/dia',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    creative_type: 'Antes e Depois',
    niche: 'Beleza & Skincare',
    format: 'Quadrado 1:1',
    platform: 'Facebook',
    structure: 'Antes (0-5s) → Transição impactante (5-7s) → Depois (7-15s) → Produto revelado (15-20s) → CTA (20-25s)',
    strategy: 'Transformação Visual + FOMO',
    why_works: 'A transformação visual é o argumento mais poderoso no nicho de beleza. A transição rápida mantém atenção. Mostrar o produto apenas após o resultado cria desejo antes da oferta.',
    hook_example: '"Minha pele há 30 dias vs hoje. A diferença é essa aqui 👇"',
    copy_example: 'Eu não acreditava que ia funcionar. Mas 30 dias depois minha pele é completamente diferente. Ainda tem no estoque — link na bio.',
    target_audience: 'Mulheres 20-40 anos, interesse em skincare e cuidados pessoais, público frio',
    difficulty: 'Fácil',
    estimated_ctr: '3-5%',
    budget_range: 'R$40-100/dia',
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    creative_type: 'POV Situacional',
    niche: 'Produtividade',
    format: 'Vertical 9:16',
    platform: 'TikTok',
    structure: 'Setup POV (0-2s) → Situação de dor (2-8s) → Virada (8-15s) → Solução em uso (15-22s) → CTA (22-30s)',
    strategy: 'Identificação + Storytelling',
    why_works: 'O formato POV cria imersão total. O espectador literalmente se vê na situação. Alta identificação = alto compartilhamento orgânico entre pessoas com o mesmo problema.',
    hook_example: '"POV: são 23h, você tem 3 projetos atrasados e não consegue focar em nada."',
    copy_example: 'Esse app mudou como eu trabalho. De 2h perdidas por dia para foco total em 20 minutos. Teste grátis por 7 dias.',
    target_audience: 'Profissionais e estudantes 20-35 anos, alta ansiedade com produtividade, público frio',
    difficulty: 'Médio',
    estimated_ctr: '2-5%',
    budget_range: 'R$30-80/dia',
    created_at: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    creative_type: 'Demonstração Live',
    niche: 'SaaS / Tech',
    format: 'Horizontal 16:9',
    platform: 'YouTube',
    structure: 'Problema revelado (0-5s) → "Existe uma forma melhor" (5-10s) → Demo do produto (10-45s) → Comparação de resultado (45-55s) → CTA com oferta (55-60s)',
    strategy: 'Product-Led + Contraste',
    why_works: 'Para software, ver é crer. A demonstração em tempo real elimina desconfiança. Mostrar economia de tempo antes de revelar o preço faz o preço parecer pequeno.',
    hook_example: '"Eu gastava 4 horas por dia nisso. Agora levo 12 minutos. Deixa eu te mostrar como."',
    copy_example: 'Enquanto você faz isso manualmente, seus concorrentes já automatizaram. Veja a diferença em tempo real — teste grátis por 14 dias.',
    target_audience: 'Empresários e gestores 28-45 anos, já conscientes do problema, público morno/quente',
    difficulty: 'Avançado',
    estimated_ctr: '1-3%',
    budget_range: 'R$100-300/dia',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '6',
    creative_type: 'Storytelling de Origem',
    niche: 'Infoproduto',
    format: 'Vertical 9:16',
    platform: 'Instagram',
    structure: 'Momento mais difícil (0-5s) → Jornada resumida (5-15s) → Resultado atual (15-22s) → "Criei isso para você" (22-27s) → CTA (27-30s)',
    strategy: 'Origem da Marca + Propósito',
    why_works: 'A história de origem humaniza o produto e cria conexão emocional profunda. Quando o fundador viveu o mesmo problema do cliente, a credibilidade é máxima.',
    hook_example: '"Em 2021 eu estava quebrado, endividado e sem saber o que fazer. Hoje faturei R$300k esse mês."',
    copy_example: 'Não criei esse curso para ficar rico. Criei porque passei pela mesma dor que você está passando agora. E quero te mostrar o caminho.',
    target_audience: 'Adultos 25-45 anos que buscam transformação financeira, público frio a morno',
    difficulty: 'Médio',
    estimated_ctr: '2-5%',
    budget_range: 'R$50-150/dia',
    created_at: '2024-01-06T00:00:00Z',
  },
]

// ─── Difficulty badge helper ──────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: LibraryAd['difficulty'] }) {
  const map = {
    'Fácil': 'success',
    'Médio': 'warning',
    'Avançado': 'error',
  } as const
  return <Badge variant={map[level]}>{level}</Badge>
}

// ─── Copy to clipboard button ─────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-[10px] text-[#6b6b8a] hover:text-[#aa3bff] transition-colors px-2 py-1 rounded hover:bg-[rgba(170,59,255,0.08)]"
    >
      {copied ? <CheckCheck size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copiado!' : label}
    </button>
  )
}

// ─── Ad card ─────────────────────────────────────────────────────────────────

function AdCard({ ad, index }: { ad: LibraryAd; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="relative glass hover:border-[rgba(170,59,255,0.3)] transition-all duration-200 overflow-hidden">
        {/* Left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#aa3bff] to-[#6366f1]" />

        <div className="p-5 pl-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">{ad.creative_type}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="purple">{ad.niche}</Badge>
                <Badge variant="default">{ad.platform}</Badge>
                <Badge variant="default">{ad.format}</Badge>
                <DifficultyBadge level={ad.difficulty} />
              </div>
            </div>
            {/* Metrics */}
            <div className="shrink-0 text-right space-y-1">
              <div className="flex items-center gap-1 justify-end text-[10px] text-[#6b6b8a]">
                <TrendingUp size={10} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{ad.estimated_ctr}</span>
                <span>CTR</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-[10px] text-[#6b6b8a]">
                <DollarSign size={10} className="text-[#f59e0b]" />
                <span>{ad.budget_range}</span>
              </div>
            </div>
          </div>

          {/* Structure */}
          <div>
            <p className="text-[10px] text-[#6b6b8a] font-semibold uppercase tracking-wide mb-1.5">Estrutura</p>
            <p className="text-xs text-[#c4c4d4] leading-relaxed">{ad.structure}</p>
          </div>

          {/* Strategy */}
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[#6b6b8a] font-semibold uppercase tracking-wide">Estratégia:</p>
            <Badge variant="warning">{ad.strategy}</Badge>
          </div>

          {/* Hook example */}
          <div className="rounded-lg bg-[rgba(99,102,241,0.07)] border border-[rgba(99,102,241,0.15)] p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap size={11} className="text-[#6366f1]" />
                <p className="text-[10px] text-[#6366f1] font-semibold uppercase tracking-wide">Hook de Abertura</p>
              </div>
              <CopyButton text={ad.hook_example} label="Copiar hook" />
            </div>
            <p className="text-xs text-[#c4c4d4] italic leading-relaxed">{ad.hook_example}</p>
          </div>

          {/* Why works */}
          <div className="rounded-lg bg-[rgba(170,59,255,0.06)] border border-[rgba(170,59,255,0.1)] p-3">
            <p className="text-[10px] text-[#aa3bff] font-semibold uppercase tracking-wide mb-1">Por que funciona</p>
            <p className="text-xs text-[#c4c4d4] leading-relaxed">{ad.why_works}</p>
          </div>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Copy example */}
                <div className="rounded-lg bg-[rgba(34,211,238,0.05)] border border-[rgba(34,211,238,0.12)] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Copy size={11} className="text-[#22d3ee]" />
                      <p className="text-[10px] text-[#22d3ee] font-semibold uppercase tracking-wide">Exemplo de Copy</p>
                    </div>
                    <CopyButton text={ad.copy_example} label="Copiar copy" />
                  </div>
                  <p className="text-xs text-[#c4c4d4] leading-relaxed">{ad.copy_example}</p>
                </div>

                {/* Target audience */}
                <div className="flex items-start gap-2">
                  <Users size={13} className="text-[#f59e0b] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#6b6b8a] font-semibold uppercase tracking-wide mb-0.5">Público-alvo</p>
                    <p className="text-xs text-[#c4c4d4]">{ad.target_audience}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-[rgba(255,255,255,0.05)]">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
            >
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
              {expanded ? 'Menos detalhes' : 'Ver copy + público-alvo'}
            </button>
            <div className="flex items-center gap-1">
              <Target size={11} className="text-[#6b6b8a]" />
              <span className="text-[10px] text-[#6b6b8a]">{ad.platform}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass p-5 space-y-4 overflow-hidden">
      <div className="skeleton h-4 w-2/5 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="skeleton h-14 w-full rounded-lg" />
      <div className="skeleton h-14 w-full rounded-lg" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WinnersLibrary() {
  const { profile } = useAuth()
  const [searchNiche, setSearchNiche] = useState('')
  const [platformFilter, setPlatformFilter] = useState('Todos')
  const [difficultyFilter, setDifficultyFilter] = useState('Todos')
  const [loading, setLoading] = useState(false)
  const [ads, setAds] = useState<LibraryAd[]>(DEFAULT_ADS)
  const [searchedNiche, setSearchedNiche] = useState('')
  const [error, setError] = useState<string | null>(null)

  const platforms = ['Todos', 'TikTok', 'Instagram', 'Facebook', 'YouTube']
  const difficulties = ['Todos', 'Fácil', 'Médio', 'Avançado']

  const filtered = ads.filter((a) => {
    if (platformFilter !== 'Todos' && a.platform !== platformFilter) return false
    if (difficultyFilter !== 'Todos' && a.difficulty !== difficultyFilter) return false
    return true
  })

  async function handleSearch() {
    if (!searchNiche.trim()) return
    setLoading(true)
    setError(null)
    try {
      const tokenResult = await consumeTokens('winnersLibrary')
      if (!tokenResult.success) {
        setError(tokenLimitMessage(tokenResult, profile?.plan?.display_name))
        return
      }
      const results = await searchAdLibrary(searchNiche.trim())
      setAds(results)
      setSearchedNiche(searchNiche.trim())
      setPlatformFilter('Todos')
      setDifficultyFilter('Todos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pesquisar.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setAds(DEFAULT_ADS)
    setSearchedNiche('')
    setSearchNiche('')
    setPlatformFilter('Todos')
    setDifficultyFilter('Todos')
    setError(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-[#6366f1]" />
          <h2 className="text-xl font-bold text-white">Biblioteca de Anúncios</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Pesquise por nicho e a IA gera templates com estrutura, hook, copy e métricas reais
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="mb-4 p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a]" />
              <input
                type="text"
                placeholder="Ex: emagrecimento, infoproduto, e-commerce de roupas, SaaS financeiro..."
                value={searchNiche}
                onChange={(e) => setSearchNiche(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#c4c4d4] placeholder:text-[#6b6b8a] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] outline-none focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)]"
              />
            </div>
            <Button
              onClick={handleSearch}
              loading={loading}
              disabled={!searchNiche.trim()}
              className="shrink-0 px-5"
            >
              <Sparkles size={14} />
              {loading ? 'Pesquisando...' : 'Pesquisar com IA'}
            </Button>
          </div>

          {searchedNiche && !loading && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
              <p className="text-xs text-[#6b6b8a]">
                Mostrando {filtered.length} templates para{' '}
                <span className="text-[#aa3bff] font-semibold">"{searchedNiche}"</span>
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors underline underline-offset-2"
              >
                Limpar pesquisa
              </button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 border text-sm" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-[#6b6b8a]" />
              <span className="text-xs text-[#6b6b8a] font-medium">Filtrar:</span>
            </div>
            {[
              { label: 'Plataforma', value: platformFilter, options: platforms, onChange: setPlatformFilter },
              { label: 'Dificuldade', value: difficultyFilter, options: difficulties, onChange: setDifficultyFilter },
            ].map((f) => (
              <div key={f.label} className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="appearance-none rounded-lg pl-3 pr-7 py-1.5 text-xs text-[#c4c4d4] border border-[rgba(170,59,255,0.15)] outline-none focus:border-[rgba(170,59,255,0.4)] cursor-pointer"
                  style={{ background: '#0f0f1a' }}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o} style={{ background: '#0f0f1a' }}>{f.label}: {o}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b8a] pointer-events-none" />
              </div>
            ))}
            <Badge variant="purple" className="ml-auto">{filtered.length} templates</Badge>
          </div>
        </Card>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ad, i) => (
            <AdCard key={ad.id} ad={ad} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#6b6b8a]">Nenhum template encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  )
}
