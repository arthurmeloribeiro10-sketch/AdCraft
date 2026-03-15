import { useState, useRef } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Upload, Link, Sparkles, CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import { analyzeVideo } from '../lib/ai'
import type { VideoAnalysisResult } from '../lib/ai'
import { useStore } from '../store/useStore'
import { generateId } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ScoreRing from '../components/ui/ScoreRing'

const SCORE_LABELS = [
  { key: 'hook' as const, label: 'Hook', color: '#aa3bff' },
  { key: 'retention' as const, label: 'Retenção', color: '#6366f1' },
  { key: 'clarity' as const, label: 'Clareza', color: '#22d3ee' },
  { key: 'storytelling' as const, label: 'Storytelling', color: '#f59e0b' },
  { key: 'cta' as const, label: 'CTA', color: '#22c55e' },
  { key: 'viral' as const, label: 'Viral', color: '#ef4444' },
]

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6b6b8a] w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
      <span className="text-xs font-medium text-[#c4c4d4] w-8 text-right">{value}</span>
    </div>
  )
}

function SkeletonAnalysis() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="skeleton w-32 h-32 rounded-full" />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton h-5 w-full rounded" />
      ))}
      <div className="skeleton h-20 w-full rounded-xl" />
      <div className="skeleton h-20 w-full rounded-xl" />
    </div>
  )
}

export default function VideoAnalyzer() {
  const { addAnalysis } = useStore()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAnalyze() {
    if (!description.trim() && !url.trim()) return
    setLoading(true)
    setResult(null)
    const res = await analyzeVideo({ url: url || undefined, description: description || url })
    setResult(res)
    addAnalysis({
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
          <Video size={18} className="text-[#22d3ee]" />
          <h2 className="text-xl font-bold text-white">Analisador de Vídeo</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Analise criativos e obtenha um score detalhado com sugestões de melhoria
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input methods */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h3 className="text-sm font-semibold text-[#c4c4d4] mb-5">Enviar Vídeo</h3>

            {/* URL input */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link size={13} className="text-[#aa3bff]" />
                <span className="text-xs font-medium text-[#c4c4d4]">Link do Vídeo</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://tiktok.com/... ou https://drive.google.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 rounded-lg px-3.5 py-2.5 text-sm text-[#c4c4d4] placeholder:text-[#6b6b8a] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] outline-none focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)]"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              <span className="text-xs text-[#6b6b8a]">ou</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            </div>

            {/* Drag and drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#aa3bff] bg-[rgba(170,59,255,0.08)]'
                  : 'border-[rgba(170,59,255,0.2)] hover:border-[rgba(170,59,255,0.4)] hover:bg-[rgba(170,59,255,0.04)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setDescription(`Arquivo: ${file.name}`)
                }}
              />
              <Upload size={22} className="text-[#6b6b8a] mx-auto mb-2" />
              <p className="text-sm text-[#c4c4d4] font-medium mb-1">
                Arraste e solte ou clique para enviar
              </p>
              <p className="text-xs text-[#6b6b8a]">MP4, MOV, AVI até 500MB</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
              <span className="text-xs text-[#6b6b8a]">ou descreva</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            </div>

            {/* Description fallback */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-sm font-medium text-[#c4c4d4]">
                Descrição do Criativo
              </label>
              <textarea
                placeholder="Descreva o vídeo: tipo de hook, produto mostrado, duração, formato..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm text-[#c4c4d4] placeholder:text-[#6b6b8a] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] outline-none focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)] resize-none"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              loading={loading}
              disabled={!description.trim() && !url.trim()}
              className="w-full py-3"
            >
              <Sparkles size={15} />
              {loading ? 'Analisando...' : 'Analisar Criativo'}
            </Button>
          </Card>
        </motion.div>

        {/* Right: Results */}
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          {loading ? (
            <Card><SkeletonAnalysis /></Card>
          ) : result ? (
            <AnimatePresence>
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* Score ring */}
                <Card className="text-center">
                  <p className="text-xs text-[#6b6b8a] mb-4">Score Criativo Geral</p>
                  <div className="flex justify-center mb-4">
                    <ScoreRing score={result.overallScore} size={140} />
                  </div>
                  <Badge
                    variant={
                      result.overallScore >= 75 ? 'success' :
                      result.overallScore >= 55 ? 'warning' : 'error'
                    }
                    className="text-sm px-4 py-1"
                  >
                    {result.overallScore >= 75 ? 'Excelente' :
                     result.overallScore >= 55 ? 'Bom potencial' : 'Precisa melhorar'}
                  </Badge>
                </Card>

                {/* Score breakdown */}
                <Card className="p-4">
                  <h4 className="text-xs font-semibold text-[#c4c4d4] mb-3">Breakdown de Score</h4>
                  <div className="space-y-3">
                    {SCORE_LABELS.map((sl) => (
                      <ScoreBar
                        key={sl.key}
                        label={sl.label}
                        value={result.scoreBreakdown[sl.key]}
                        color={sl.color}
                      />
                    ))}
                  </div>
                </Card>

                {/* Strengths */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <h4 className="text-xs font-semibold text-emerald-400">Pontos Fortes</h4>
                  </div>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#c4c4d4]">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Weaknesses */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={14} className="text-red-400" />
                    <h4 className="text-xs font-semibold text-red-400">Pontos Fracos</h4>
                  </div>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#c4c4d4]">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Suggestions */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-[#aa3bff]" />
                    <h4 className="text-xs font-semibold text-[#aa3bff]">Sugestões de Melhoria</h4>
                  </div>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#c4c4d4]">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[rgba(170,59,255,0.12)] text-[#aa3bff] text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Card className="flex flex-col items-center justify-center min-h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(34,211,238,0.08)] flex items-center justify-center mb-4">
                <Video size={28} className="text-[#22d3ee]" />
              </div>
              <h3 className="text-base font-semibold text-[#c4c4d4] mb-2">
                Aguardando análise
              </h3>
              <p className="text-sm text-[#6b6b8a] max-w-xs">
                Insira o link do vídeo ou descreva o criativo para obter um score detalhado
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
