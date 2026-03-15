import { useState } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { PenTool, Copy, Sparkles } from 'lucide-react'
import { generateCopy } from '../lib/ai'
import type { CopyResult } from '../lib/ai'
import { useStore } from '../store/useStore'
import { generateId } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

type TabKey = 'main' | 'variations' | 'headlines' | 'ctas'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'main', label: 'Copy Principal' },
  { key: 'variations', label: '3 Variações' },
  { key: 'headlines', label: '5 Headlines' },
  { key: 'ctas', label: '3 CTAs' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#6b6b8a] hover:text-[#aa3bff] hover:bg-[rgba(170,59,255,0.08)] transition-all shrink-0"
    >
      <Copy size={11} />
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

function SkeletonBlock() {
  return <div className="skeleton h-16 w-full rounded-xl" />
}

export default function CopyGenerator() {
  const { addCopy } = useStore()
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('main')

  async function handleGenerate() {
    if (!product.trim() || !audience.trim() || !problem.trim()) return
    setLoading(true)
    setResult(null)
    const res = await generateCopy({ product, audience, problem })
    setResult(res)
    addCopy({
      ...res,
      id: generateId(),
      user_id: '',
      created_at: new Date().toISOString(),
    })
    setLoading(false)
    setActiveTab('main')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <PenTool size={18} className="text-[#6366f1]" />
          <h2 className="text-xl font-bold text-white">Gerador de Copy</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Crie copies persuasivas que convertem para seus anúncios
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h3 className="text-sm font-semibold text-[#c4c4d4] mb-5">Dados do Anúncio</h3>
            <div className="space-y-4">
              <Input
                label="Produto"
                placeholder="Ex: Curso de finanças pessoais, App de meditação..."
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
              <Input
                label="Público-alvo"
                placeholder="Ex: Jovens adultos endividados, mães de primeira viagem..."
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c4c4d4]">Problema Principal</label>
                <textarea
                  placeholder="Ex: Falta de controle financeiro, dificuldade para dormir..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm text-[#c4c4d4] placeholder:text-[#6b6b8a] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] outline-none focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)] resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                loading={loading}
                disabled={!product.trim() || !audience.trim() || !problem.trim()}
                className="w-full py-3"
                variant="primary"
              >
                <Sparkles size={15} />
                {loading ? 'Gerando copy...' : 'Gerar Copy'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Right: Result */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          {loading ? (
            <Card>
              <div className="space-y-3">
                <div className="skeleton h-5 w-36 rounded" />
                <div className="skeleton h-4 w-48 rounded" />
                {[1, 2, 3].map((i) => <SkeletonBlock key={i} />)}
              </div>
            </Card>
          ) : result ? (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                {/* Tab bar */}
                <div className="flex gap-1 mb-3 p-1 bg-[rgba(15,15,26,0.8)] rounded-xl border border-[rgba(170,59,255,0.1)]">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white shadow-[0_0_12px_rgba(170,59,255,0.3)]'
                          : 'text-[#6b6b8a] hover:text-[#c4c4d4]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === 'main' && (
                      <Card>
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="purple">Copy Principal</Badge>
                          <CopyButton text={result.mainCopy} />
                        </div>
                        <p className="text-sm text-[#c4c4d4] leading-relaxed whitespace-pre-line">
                          {result.mainCopy}
                        </p>
                      </Card>
                    )}

                    {activeTab === 'variations' && (
                      <div className="space-y-3">
                        {result.variations.map((v, i) => (
                          <Card key={i} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="default">Variação {i + 1}</Badge>
                              <CopyButton text={v} />
                            </div>
                            <p className="text-sm text-[#c4c4d4] leading-relaxed">{v}</p>
                          </Card>
                        ))}
                      </div>
                    )}

                    {activeTab === 'headlines' && (
                      <div className="space-y-2">
                        {result.headlines.map((h, i) => (
                          <Card key={i} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-[rgba(170,59,255,0.12)] text-[#aa3bff] text-[10px] font-bold flex items-center justify-center mt-0.5">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-[#c4c4d4] font-medium leading-relaxed">{h}</p>
                              </div>
                              <CopyButton text={h} />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {activeTab === 'ctas' && (
                      <div className="space-y-2">
                        {result.ctas.map((cta, i) => (
                          <Card key={i} className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-[rgba(34,197,94,0.12)] text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-[#c4c4d4] font-medium">{cta}</p>
                              </div>
                              <CopyButton text={cta} />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Card className="flex flex-col items-center justify-center min-h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center mb-4">
                <PenTool size={28} className="text-[#6366f1]" />
              </div>
              <h3 className="text-base font-semibold text-[#c4c4d4] mb-2">
                Sua copy aparecerá aqui
              </h3>
              <p className="text-sm text-[#6b6b8a] max-w-xs">
                Preencha os campos e clique em "Gerar Copy" para criar copies persuasivas para seus anúncios
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
