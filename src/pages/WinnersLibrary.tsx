import { useState, useEffect, useRef } from "react"
import { motion } from 'framer-motion'
import { BookOpen, Filter, ChevronDown } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { WinnerAd } from '../types'
import { consumeTokens, tokenLimitMessage } from '../lib/tokens'
import { useAuth } from '../context/AuthContext'

const MOCK_WINNERS: WinnerAd[] = [
  {
    id: '1',
    creative_type: 'UGC Testemunho',
    niche: 'Emagrecimento',
    format: 'Vertical 9:16',
    platform: 'TikTok',
    structure: 'Hook visual (0-3s) → Problema pessoal (3-8s) → Descoberta (8-15s) → Resultado (15-25s) → CTA (25-30s)',
    strategy: 'Prova Social Pessoal + Urgência',
    why_works: 'A narrativa em primeira pessoa cria identificação imediata. O resultado mostrado antes do CTA elimina objeções antes que apareçam. A linguagem casual e autêntica eleva a credibilidade.',
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
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    creative_type: 'React a Haters',
    niche: 'Educação Financeira',
    format: 'Vertical 9:16',
    platform: 'TikTok',
    structure: 'Comentário negativo na tela (0-3s) → Resposta emocional (3-8s) → Prova com números (8-20s) → Convite à transformação (20-28s) → CTA (28-30s)',
    strategy: 'Controvérsia + Credibilidade',
    why_works: 'Comentários negativos geram curiosidade imediata. A prova com números reais é irrefutável. O tom combativo atrai pessoas que também enfrentam ceticismo — o público-alvo ideal.',
    created_at: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    creative_type: 'POV Situacional',
    niche: 'Produtividade',
    format: 'Vertical 9:16',
    platform: 'TikTok',
    structure: 'Setup POV (0-2s) → Situação de dor (2-8s) → Virada (8-15s) → Solução em uso (15-22s) → CTA (22-30s)',
    strategy: 'Identificação + Storytelling',
    why_works: 'O formato POV cria imersão total. O espectador literalmente se vê na situação. Alta identificação = alto compartilhamento orgânico entre pessoas com o mesmo problema.',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: '6',
    creative_type: 'Demonstração Live',
    niche: 'SaaS / Tech',
    format: 'Horizontal 16:9',
    platform: 'YouTube',
    structure: 'Problema revelado (0-5s) → "Existe uma forma melhor" (5-10s) → Screen recording do produto (10-45s) → Comparação de tempo/resultado (45-55s) → CTA com oferta (55-60s)',
    strategy: 'Demo Product-Led + Contraste',
    why_works: 'Para software, ver é crer. A demonstração em tempo real elimina desconfiança. Mostrar quanto tempo economiza antes de revelar o preço faz o preço parecer pequeno.',
    created_at: '2024-01-06T00:00:00Z',
  },
  {
    id: '7',
    creative_type: 'Comparação Direta',
    niche: 'E-commerce / Produto Físico',
    format: 'Quadrado 1:1',
    platform: 'Facebook',
    structure: 'Alternativa popular (0-5s) → Problema da alternativa (5-12s) → Revelação do produto (12-18s) → Benefícios claros (18-24s) → Preço + Oferta (24-30s)',
    strategy: 'Contraste + Oferta Direta',
    why_works: 'Começar com o concorrente pega atenção de quem já usa aquela solução. Mostrar o problema da solução atual cria abertura para a nova. Funciona especialmente bem com público quente.',
    created_at: '2024-01-07T00:00:00Z',
  },
  {
    id: '8',
    creative_type: 'Storytelling de Origem',
    niche: 'Infoproduto',
    format: 'Vertical 9:16',
    platform: 'Instagram',
    structure: 'Momento mais difícil (0-5s) → Jornada resumida (5-15s) → Resultado atual (15-22s) → "Criei isso para você" (22-27s) → CTA (27-30s)',
    strategy: 'Origem da Marca + Propósito',
    why_works: 'A história de origem humaniza o produto e cria conexão emocional profunda. Quando o fundador viveu o mesmo problema do cliente, a credibilidade é máxima. O propósito "criei para você" reduz resistência à compra.',
    created_at: '2024-01-08T00:00:00Z',
  },
]

const ALL_NICHES = ['Todos', ...Array.from(new Set(MOCK_WINNERS.map((w) => w.niche)))]
const ALL_FORMATS = ['Todos', ...Array.from(new Set(MOCK_WINNERS.map((w) => w.format)))]
const ALL_PLATFORMS = ['Todos', ...Array.from(new Set(MOCK_WINNERS.map((w) => w.platform)))]

export default function WinnersLibrary() {
  const { profile } = useAuth()
  const [nicheFilter, setNicheFilter] = useState('Todos')
  const [formatFilter, setFormatFilter] = useState('Todos')
  const [platformFilter, setPlatformFilter] = useState('Todos')
  const [tokenError, setTokenError] = useState<string | null>(null)
  const tokenConsumedRef = useRef(false)

  useEffect(() => {
    if (tokenConsumedRef.current) return
    tokenConsumedRef.current = true
    consumeTokens('winnersLibrary').then(result => {
      if (!result.success) {
        setTokenError(tokenLimitMessage(result, profile?.plan?.display_name))
      }
    })
  }, [profile?.plan?.display_name])

  const filtered = MOCK_WINNERS.filter((w) => {
    if (nicheFilter !== 'Todos' && w.niche !== nicheFilter) return false
    if (formatFilter !== 'Todos' && w.format !== formatFilter) return false
    if (platformFilter !== 'Todos' && w.platform !== platformFilter) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-[#6366f1]" />
          <h2 className="text-xl font-bold text-white">Biblioteca de Anúncios Vencedores</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Estude as estruturas e estratégias dos criativos que mais convertem
        </p>
      </motion.div>

      {tokenError && (
        <div className="mb-4 rounded-xl px-4 py-3 border text-sm" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
          {tokenError}
        </div>
      )}

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} className="text-[#6b6b8a]" />
            <span className="text-xs font-medium text-[#6b6b8a]">Filtros</span>
            <Badge variant="purple" className="ml-auto">{filtered.length} anúncios</Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Nicho', value: nicheFilter, options: ALL_NICHES, onChange: setNicheFilter },
              { label: 'Formato', value: formatFilter, options: ALL_FORMATS, onChange: setFormatFilter },
              { label: 'Plataforma', value: platformFilter, options: ALL_PLATFORMS, onChange: setPlatformFilter },
            ].map((f) => (
              <div key={f.label} className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="appearance-none rounded-lg pl-3 pr-8 py-2 text-xs text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.15)] outline-none focus:border-[rgba(170,59,255,0.4)] cursor-pointer"
                  style={{ background: '#0f0f1a' }}
                >
                  {f.options.map((o) => (
                    <option key={o} value={o} style={{ background: '#0f0f1a' }}>{f.label}: {o}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b8a] pointer-events-none" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="relative glass p-5 hover:border-[rgba(170,59,255,0.3)] transition-all duration-200 overflow-hidden">
              {/* Left accent border */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#aa3bff] to-[#6366f1]" />

              <div className="flex items-start justify-between gap-3 mb-3 pl-3">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{ad.creative_type}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="purple">{ad.niche}</Badge>
                    <Badge variant="default">{ad.format}</Badge>
                    <Badge variant="default">{ad.platform}</Badge>
                  </div>
                </div>
              </div>

              <div className="pl-3 space-y-3">
                {/* Structure */}
                <div>
                  <p className="text-[10px] text-[#6b6b8a] font-semibold uppercase tracking-wide mb-1">Estrutura</p>
                  <p className="text-xs text-[#c4c4d4] leading-relaxed">{ad.structure}</p>
                </div>

                {/* Strategy */}
                <div>
                  <p className="text-[10px] text-[#6b6b8a] font-semibold uppercase tracking-wide mb-1">Estratégia</p>
                  <Badge variant="warning">{ad.strategy}</Badge>
                </div>

                {/* Why it works */}
                <div className="p-2.5 rounded-lg bg-[rgba(170,59,255,0.06)] border border-[rgba(170,59,255,0.1)]">
                  <p className="text-[10px] text-[#aa3bff] font-semibold uppercase tracking-wide mb-1">Por que funciona</p>
                  <p className="text-xs text-[#c4c4d4] leading-relaxed">{ad.why_works}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#6b6b8a]">Nenhum anúncio encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  )
}
