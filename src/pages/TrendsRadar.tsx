import { useState, useEffect } from "react"
import { motion } from 'framer-motion'
import { TrendingUp, RefreshCw, Zap, Radio } from 'lucide-react'
import { generateTrends } from '../lib/ai'
import type { Trend } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const containerVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, y: 0 },
}

function GrowthBar({ pct }: { pct: number }) {
  const width = Math.min((pct / 400) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#aa3bff] to-[#22d3ee]"
          style={{ boxShadow: '0 0 8px rgba(170,59,255,0.4)' }}
        />
      </div>
      <span className="text-xs font-bold text-[#aa3bff] w-12 text-right">+{pct}%</span>
    </div>
  )
}

const POPULAR_HOOKS = [
  { rank: 1, text: '"Você sabia que [fato surpreendente]?"', platform: 'TikTok' },
  { rank: 2, text: '"Para de fazer isso se você quer [resultado]"', platform: 'Instagram' },
  { rank: 3, text: '"Em [tempo] eu consegui [resultado] usando apenas..."', platform: 'TikTok' },
  { rank: 4, text: '"Esse erro está te custando [valor/oportunidade]"', platform: 'Facebook' },
  { rank: 5, text: '"POV: você finalmente descobriu [solução]"', platform: 'TikTok' },
  { rank: 6, text: '"Fiz isso por [período] e olha o que aconteceu"', platform: 'Instagram' },
  { rank: 7, text: '"Testei [X produtos] e apenas um funcionou de verdade"', platform: 'YouTube' },
]

export default function TrendsRadar() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

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

  const formatos = trends.filter((t) => t.category === 'formato')
  const engajamento = trends.filter((t) => t.category === 'engajamento')
  const producao = trends.filter((t) => t.category === 'produção')
  const distribuicao = trends.filter((t) => t.category === 'distribuição')

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Radar de Tendências</h2>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[#6b6b8a] text-sm">
                Tendências de criativos atualizadas para escalar seus anúncios
              </p>
              <Badge variant="success" className="flex items-center gap-1">
                <Radio size={9} className="animate-pulse" />
                Atualizado em tempo real
              </Badge>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={loadTrends}
            loading={loading}
            className="gap-2"
          >
            <RefreshCw size={13} />
            Atualizar
          </Button>
        </div>
        <p className="text-[10px] text-[#6b6b8a] mt-2">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Formatos em Alta */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#aa3bff]" />
              <h3 className="text-base font-bold text-white">Formatos em Alta</h3>
              <Badge variant="purple">{formatos.length} formatos</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formatos.map((t) => (
                <motion.div key={t.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{t.format}</h4>
                        <p className="text-xs text-[#6b6b8a] mt-0.5">{t.hook_style}</p>
                      </div>
                      <Badge variant="success">+{t.growth_pct}%</Badge>
                    </div>
                    <GrowthBar pct={t.growth_pct} />
                    <p className="text-xs text-[#6b6b8a] mt-2 leading-relaxed">{t.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Estilos de Hook Populares */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[#22d3ee]" />
              <h3 className="text-base font-bold text-white">Estilos de Hook Populares</h3>
            </div>
            <Card className="p-4">
              <div className="space-y-2">
                {POPULAR_HOOKS.map((hook) => (
                  <div
                    key={hook.rank}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
                  >
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        hook.rank <= 3
                          ? 'bg-gradient-to-br from-[#aa3bff] to-[#6366f1] text-white shadow-[0_0_10px_rgba(170,59,255,0.3)]'
                          : 'bg-[rgba(255,255,255,0.06)] text-[#6b6b8a]'
                      }`}
                    >
                      {hook.rank}
                    </span>
                    <p className="text-sm text-[#c4c4d4] flex-1 italic">{hook.text}</p>
                    <Badge variant="default" className="shrink-0">{hook.platform}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Tendências de Criativos */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#f59e0b]" />
              <h3 className="text-base font-bold text-white">Tendências de Criativos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...engajamento, ...producao, ...distribuicao].map((t) => (
                <motion.div key={t.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Card className="p-4 relative overflow-hidden">
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-20"
                      style={{
                        background: t.category === 'engajamento' ? '#aa3bff' :
                                   t.category === 'produção' ? '#22d3ee' : '#f59e0b',
                        transform: 'translate(30%, -30%)',
                      }}
                    />
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-white">{t.format}</h4>
                      <div className="flex gap-1.5">
                        <Badge
                          variant={t.category === 'engajamento' ? 'purple' : t.category === 'produção' ? 'default' : 'warning'}
                        >
                          {t.category}
                        </Badge>
                        <Badge variant="success">+{t.growth_pct}%</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-[#6b6b8a] leading-relaxed mb-2">{t.description}</p>
                    <GrowthBar pct={t.growth_pct} />
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
