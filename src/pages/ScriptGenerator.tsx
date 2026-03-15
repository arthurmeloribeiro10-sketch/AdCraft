import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Sparkles, ChevronDown } from 'lucide-react'
import { generateScript } from '../lib/ai'
import type { ScriptResult } from '../lib/ai'
import { useStore } from '../store/useStore'
import { generateId } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const PLATFORMS = ['TikTok', 'Facebook', 'Instagram', 'YouTube']

const TEMPLATES = [
  { id: 'Problema→Solução', label: 'Problema→Solução', desc: 'Identifica a dor e apresenta a solução', emoji: '🔥' },
  { id: 'Storytelling', label: 'Storytelling', desc: 'Narrativa pessoal envolvente', emoji: '📖' },
  { id: 'Demonstração', label: 'Demonstração', desc: 'Mostra o produto em ação', emoji: '🎬' },
  { id: 'Prova Social', label: 'Prova Social', desc: 'Depoimentos e resultados reais', emoji: '⭐' },
  { id: 'Antes e Depois', label: 'Antes e Depois', desc: 'Transformação visual impactante', emoji: '✨' },
  { id: 'Review', label: 'Review', desc: 'Avaliação honesta do produto', emoji: '🔍' },
  { id: 'UGC Criativo', label: 'UGC Criativo', desc: 'Conteúdo autêntico de usuário', emoji: '📱' },
]

interface ResultSection {
  key: keyof ScriptResult
  label: string
  color: string
}

const RESULT_SECTIONS: ResultSection[] = [
  { key: 'hook', label: 'Hook (Abertura)', color: '#aa3bff' },
  { key: 'development', label: 'Desenvolvimento', color: '#6366f1' },
  { key: 'demo', label: 'Demonstração', color: '#22d3ee' },
  { key: 'reinforcement', label: 'Reforço', color: '#f59e0b' },
  { key: 'cta', label: 'CTA (Chamada)', color: '#22c55e' },
]

function SkeletonBlock() {
  return <div className="skeleton h-20 w-full rounded-xl" />
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#6b6b8a] hover:text-[#aa3bff] hover:bg-[rgba(170,59,255,0.08)] transition-all"
    >
      <Copy size={12} />
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

export default function ScriptGenerator() {
  const { addScript } = useStore()
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [template, setTemplate] = useState('Problema→Solução')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScriptResult | null>(null)

  async function handleGenerate() {
    if (!product.trim() || !audience.trim()) return
    setLoading(true)
    setResult(null)
    const res = await generateScript({ product, audience, platform, template })
    setResult(res)
    addScript({
      ...res,
      id: generateId(),
      user_id: '',
      created_at: new Date().toISOString(),
    })
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[#aa3bff]" />
          <h2 className="text-xl font-bold text-white">Gerador de Roteiros</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Crie roteiros otimizados para cada plataforma e formato
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h3 className="text-sm font-semibold text-[#c4c4d4] mb-5">Configurações do Roteiro</h3>

            <div className="space-y-4">
              <Input
                label="Produto / Nicho"
                placeholder="Ex: Curso de tráfego pago, Suplemento fitness..."
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
              <Input
                label="Público-alvo"
                placeholder="Ex: Empreendedores iniciantes, mulheres 25-40 anos..."
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />

              {/* Platform */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Plataforma</label>
                <div className="relative">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full appearance-none rounded-lg px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] outline-none focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)] cursor-pointer"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} style={{ background: '#0f0f1a' }}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] pointer-events-none" />
                </div>
              </div>

              {/* Template selector */}
              <div>
                <label className="text-sm font-medium text-[#c4c4d4] mb-3 block">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        template === t.id
                          ? 'bg-[rgba(170,59,255,0.12)] border-[rgba(170,59,255,0.4)] shadow-[0_0_12px_rgba(170,59,255,0.1)]'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(170,59,255,0.2)] hover:bg-[rgba(170,59,255,0.04)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{t.emoji}</span>
                        <span className={`text-xs font-semibold ${template === t.id ? 'text-[#aa3bff]' : 'text-[#c4c4d4]'}`}>
                          {t.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6b6b8a] leading-relaxed">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                loading={loading}
                disabled={!product.trim() || !audience.trim()}
                className="w-full py-3"
              >
                <Sparkles size={15} />
                {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Right: Result */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          {loading ? (
            <Card>
              <div className="space-y-4">
                <div className="skeleton h-5 w-40 rounded" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <SkeletonBlock />
                  </div>
                ))}
              </div>
            </Card>
          ) : result ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#c4c4d4]">Roteiro Gerado</h3>
                  <div className="flex gap-2">
                    <Badge variant="purple">{platform}</Badge>
                    <Badge variant="default">{template}</Badge>
                  </div>
                </div>

                {RESULT_SECTIONS.map((section) => {
                  const value = result[section.key]
                  if (!value || typeof value !== 'string') return null
                  return (
                    <motion.div
                      key={section.key}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: section.color }}
                            />
                            <span className="text-xs font-semibold text-[#c4c4d4]">
                              {section.label}
                            </span>
                          </div>
                          <CopyButton text={value} />
                        </div>
                        <p className="text-sm text-[#c4c4d4] leading-relaxed whitespace-pre-line">
                          {value}
                        </p>
                      </Card>
                    </motion.div>
                  )
                })}

                {/* Scenes */}
                {result.scenes && result.scenes.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#22d3ee]" />
                        <span className="text-xs font-semibold text-[#c4c4d4]">Cenas</span>
                      </div>
                      <CopyButton text={result.scenes.join('\n')} />
                    </div>
                    <ul className="space-y-2">
                      {result.scenes.map((scene, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#c4c4d4]">
                          <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[rgba(170,59,255,0.12)] text-[#aa3bff] text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          {scene}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <Card className="flex flex-col items-center justify-center min-h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(170,59,255,0.08)] flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-[#aa3bff]" />
              </div>
              <h3 className="text-base font-semibold text-[#c4c4d4] mb-2">
                Pronto para criar
              </h3>
              <p className="text-sm text-[#6b6b8a] max-w-xs">
                Preencha os campos ao lado e clique em "Gerar Roteiro" para criar seu roteiro otimizado
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
