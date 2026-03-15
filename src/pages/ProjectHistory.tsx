import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, FileText, PenTool, Video, Lightbulb, ExternalLink, Ghost } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate, truncate } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

type HistoryTab = 'Roteiros' | 'Copies' | 'Análises' | 'Ideias'

const TABS: { key: HistoryTab; icon: React.ElementType; color: string }[] = [
  { key: 'Roteiros', icon: FileText, color: '#aa3bff' },
  { key: 'Copies', icon: PenTool, color: '#6366f1' },
  { key: 'Análises', icon: Video, color: '#22d3ee' },
  { key: 'Ideias', icon: Lightbulb, color: '#f59e0b' },
]

function EmptyState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(170,59,255,0.06)] flex items-center justify-center">
          <Ghost size={32} className="text-[#6b6b8a]" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgba(170,59,255,0.2)] blur-sm" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-[rgba(99,102,241,0.2)] blur-sm" />
      </div>
      <h3 className="text-base font-semibold text-[#c4c4d4] mb-2">
        Nenhum {label.toLowerCase()} salvo ainda
      </h3>
      <p className="text-sm text-[#6b6b8a] max-w-xs">
        Seus {label.toLowerCase()} gerados aparecerão aqui para fácil acesso
      </p>
    </motion.div>
  )
}

export default function ProjectHistory() {
  const { scripts, copies, analyses, ideas } = useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<HistoryTab>('Roteiros')

  const tabCounts: Record<HistoryTab, number> = {
    Roteiros: scripts.length,
    Copies: copies.length,
    Análises: analyses.length,
    Ideias: ideas.length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <History size={18} className="text-[#6b6b8a]" />
          <h2 className="text-xl font-bold text-white">Histórico</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm">
          Acesse todos os conteúdos gerados na sua sessão
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 p-1 bg-[rgba(15,15,26,0.8)] rounded-xl border border-[rgba(170,59,255,0.1)]">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white shadow-[0_0_16px_rgba(170,59,255,0.3)]'
                  : 'text-[#6b6b8a] hover:text-[#c4c4d4]'
              }`}
            >
              <Icon size={13} />
              {tab.key}
              {tabCounts[tab.key] > 0 && (
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[rgba(170,59,255,0.15)] text-[#aa3bff]'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          )
        })}
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
          {activeTab === 'Roteiros' && (
            scripts.length === 0 ? <EmptyState label="Roteiros" /> : (
              <div className="space-y-2">
                {scripts.map((script, i) => (
                  <motion.div
                    key={script.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4 hover:border-[rgba(170,59,255,0.3)] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <FileText size={13} className="text-[#aa3bff] shrink-0" />
                            <span className="text-sm font-semibold text-white truncate">
                              Roteiro: {script.product}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge variant="purple">{script.platform}</Badge>
                            <Badge variant="default">{script.template}</Badge>
                          </div>
                          <p className="text-xs text-[#6b6b8a] leading-relaxed">
                            {truncate(script.hook, 100)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-[#6b6b8a]">{formatDate(script.created_at)}</span>
                          <Button
                            variant="secondary"
                            onClick={() => navigate('/roteiros')}
                            className="text-xs py-1.5 px-3"
                          >
                            <ExternalLink size={11} />
                            Abrir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Copies' && (
            copies.length === 0 ? <EmptyState label="Copies" /> : (
              <div className="space-y-2">
                {copies.map((copy, i) => (
                  <motion.div
                    key={copy.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4 hover:border-[rgba(170,59,255,0.3)] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <PenTool size={13} className="text-[#6366f1] shrink-0" />
                            <span className="text-sm font-semibold text-white truncate">
                              Copy: {copy.product}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge variant="default">{copy.audience}</Badge>
                          </div>
                          <p className="text-xs text-[#6b6b8a] leading-relaxed">
                            {truncate(copy.mainCopy, 100)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-[#6b6b8a]">{formatDate(copy.created_at)}</span>
                          <Button
                            variant="secondary"
                            onClick={() => navigate('/copy')}
                            className="text-xs py-1.5 px-3"
                          >
                            <ExternalLink size={11} />
                            Abrir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Análises' && (
            analyses.length === 0 ? <EmptyState label="Análises" /> : (
              <div className="space-y-2">
                {analyses.map((analysis, i) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4 hover:border-[rgba(170,59,255,0.3)] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Video size={13} className="text-[#22d3ee] shrink-0" />
                            <span className="text-sm font-semibold text-white truncate">
                              Análise de Vídeo
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge
                              variant={analysis.overallScore >= 75 ? 'success' : analysis.overallScore >= 55 ? 'warning' : 'error'}
                            >
                              Score: {analysis.overallScore}/100
                            </Badge>
                          </div>
                          <p className="text-xs text-[#6b6b8a] leading-relaxed">
                            {truncate(analysis.description, 100)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-[#6b6b8a]">{formatDate(analysis.created_at)}</span>
                          <Button
                            variant="secondary"
                            onClick={() => navigate('/video')}
                            className="text-xs py-1.5 px-3"
                          >
                            <ExternalLink size={11} />
                            Abrir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Ideias' && (
            ideas.length === 0 ? <EmptyState label="Ideias" /> : (
              <div className="space-y-2">
                {ideas.map((idea, i) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4 hover:border-[rgba(170,59,255,0.3)] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Lightbulb size={13} className="text-[#f59e0b] shrink-0" />
                            <span className="text-sm font-semibold text-white truncate">
                              {idea.concept}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge variant="warning">{idea.style}</Badge>
                            <Badge variant="default">{idea.niche}</Badge>
                          </div>
                          <p className="text-xs text-[#6b6b8a] leading-relaxed">
                            {truncate(idea.description, 100)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] text-[#6b6b8a]">{formatDate(idea.created_at)}</span>
                          <Button
                            variant="secondary"
                            onClick={() => navigate('/ideias')}
                            className="text-xs py-1.5 px-3"
                          >
                            <ExternalLink size={11} />
                            Abrir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
