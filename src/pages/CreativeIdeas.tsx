import { useState } from "react"
import { motion } from 'framer-motion'
import { Lightbulb, Sparkles, FileText } from 'lucide-react'
import { generateCreativeIdeas } from '../lib/ai'
import type { CreativeIdea } from '../types'
import { useStore } from '../store/useStore'
import { generateId } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { consumeTokens, tokenLimitMessage } from '../lib/tokens'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const STYLE_COLORS: Record<string, string> = {
  'UGC Emocional': 'purple',
  'Tutorial/How-To': 'success',
  'Reação/Controvérsia': 'error',
  'POV / Roleplay': 'warning',
  'Live Test / Experimento': 'default',
  'Comparação / Educativo': 'success',
}

export default function CreativeIdeas() {
  const { addIdea } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [niche, setNiche] = useState('')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<CreativeIdea[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!niche.trim() || !product.trim() || !audience.trim()) return
    setLoading(true)
    setIdeas([])
    setError(null)
    try {
      const tokenResult = await consumeTokens('creativeIdeas')
      if (!tokenResult.success) {
        setError(tokenLimitMessage(tokenResult, profile?.plan?.display_name))
        return
      }
      const res = await generateCreativeIdeas({ niche, product, audience })
      setIdeas(res)
      res.forEach((idea) => addIdea({ ...idea, id: generateId(), user_id: '', created_at: new Date().toISOString() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar ideias.')
    } finally {
      setLoading(false)
    }
  }

  function handleUseInScript(_idea: CreativeIdea) {
    navigate('/roteiros')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={18} className="text-[#f59e0b]" />
          <h2 className="text-xl font-bold text-white">Ideias de Criativos</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Gere conceitos únicos e estratégias de vídeo para seu nicho
        </p>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nicho"
              placeholder="Ex: Fitness, Marketing digital..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
            <Input
              label="Produto"
              placeholder="Ex: Curso online, Suplemento..."
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
            <Input
              label="Público"
              placeholder="Ex: Mulheres 25-40, jovens empreendedores..."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>
          {error && (
            <div className="mt-3 rounded-lg px-3.5 py-2.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleGenerate}
              loading={loading}
              disabled={!niche.trim() || !product.trim() || !audience.trim()}
              className="px-6"
            >
              <Sparkles size={15} />
              {loading ? 'Gerando ideias...' : 'Gerar Ideias'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-56 rounded-xl" />
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ideas.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="h-full flex flex-col hover:border-[rgba(170,59,255,0.3)] transition-all duration-200 group">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-white leading-tight">{idea.concept}</h3>
                  <Badge variant={(STYLE_COLORS[idea.style] as 'purple' | 'success' | 'error' | 'warning' | 'default') ?? 'default'}>
                    {idea.style}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-[#6b6b8a] leading-relaxed flex-1 mb-3">
                  {idea.description}
                </p>

                {/* Hook highlight */}
                <div className="p-2.5 rounded-lg bg-[rgba(170,59,255,0.08)] border border-[rgba(170,59,255,0.15)] mb-3">
                  <p className="text-[10px] text-[#aa3bff] font-semibold mb-1 uppercase tracking-wide">Hook sugerido</p>
                  <p className="text-xs text-[#c4c4d4] italic leading-relaxed">{idea.hook}</p>
                </div>

                {/* Action */}
                <Button
                  variant="secondary"
                  onClick={() => handleUseInScript(idea)}
                  className="w-full text-xs py-2"
                >
                  <FileText size={12} />
                  Usar no Roteiro
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,158,11,0.08)] flex items-center justify-center mb-4">
            <Lightbulb size={28} className="text-[#f59e0b]" />
          </div>
          <h3 className="text-base font-semibold text-[#c4c4d4] mb-2">
            Sem ideias ainda
          </h3>
          <p className="text-sm text-[#6b6b8a] max-w-xs">
            Preencha os campos acima e clique em "Gerar Ideias" para criar conceitos únicos de criativos
          </p>
        </div>
      )}
    </div>
  )
}
