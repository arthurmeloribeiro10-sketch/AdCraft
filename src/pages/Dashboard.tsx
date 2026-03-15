import { motion } from 'framer-motion'
import { FileText, PenTool, Video, Lightbulb, TrendingUp, Clock, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate } from '../lib/utils'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const containerVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export default function Dashboard() {
  const { scripts, copies, analyses, ideas } = useStore()

  const stats = [
    {
      label: 'Roteiros Criados',
      value: scripts.length,
      icon: FileText,
      color: '#aa3bff',
      bg: 'rgba(170,59,255,0.1)',
    },
    {
      label: 'Copies Geradas',
      value: copies.length,
      icon: PenTool,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      label: 'Análises de Vídeo',
      value: analyses.length,
      icon: Video,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.1)',
    },
    {
      label: 'Ideias Geradas',
      value: ideas.length,
      icon: Lightbulb,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
  ]

  // Build recent activity
  type ActivityItem = {
    type: string
    title: string
    date: string
    badge: 'purple' | 'default' | 'success' | 'warning'
  }
  const recentActivity: ActivityItem[] = [
    ...scripts.slice(0, 2).map((s) => ({
      type: 'Roteiro',
      title: `Roteiro para ${s.product} — ${s.platform}`,
      date: s.created_at,
      badge: 'purple' as const,
    })),
    ...copies.slice(0, 2).map((c) => ({
      type: 'Copy',
      title: `Copy para ${c.product}`,
      date: c.created_at,
      badge: 'default' as const,
    })),
    ...analyses.slice(0, 2).map((a) => ({
      type: 'Análise',
      title: `Análise: ${a.description.slice(0, 40)}...`,
      date: a.created_at,
      badge: 'success' as const,
    })),
    ...ideas.slice(0, 2).map((i) => ({
      type: 'Ideia',
      title: i.concept,
      date: i.created_at,
      badge: 'warning' as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        </div>
        <p className="text-[#6b6b8a] text-sm ml-11">
          Gerencie seus criativos e acompanhe seu desempenho
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
                  style={{ background: stat.bg, transform: 'translate(30%, -30%)' }}
                />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#6b6b8a] text-xs mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ background: stat.bg }}
                  >
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                  <span className="text-xs text-[#6b6b8a] flex items-center gap-1">
                    <TrendingUp size={11} className="text-emerald-400" />
                    <span className="text-emerald-400">Ativo</span>
                  </span>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#aa3bff]" />
              <h3 className="font-semibold text-white text-sm">Atividade Recente</h3>
            </div>
            <Badge variant="purple">
              {recentActivity.length} item{recentActivity.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-[rgba(170,59,255,0.08)] flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-[#6b6b8a]" />
              </div>
              <p className="text-[#6b6b8a] text-sm">Nenhuma atividade ainda</p>
              <p className="text-[#6b6b8a] text-xs mt-1">
                Comece gerando seu primeiro roteiro ou copy
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={item.badge}>{item.type}</Badge>
                    <p className="text-sm text-[#c4c4d4] truncate">{item.title}</p>
                  </div>
                  <span className="text-xs text-[#6b6b8a] shrink-0 ml-4">
                    {formatDate(item.date)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Novo Roteiro', icon: FileText, path: '/roteiros', color: '#aa3bff' },
          { label: 'Nova Copy', icon: PenTool, path: '/copy', color: '#6366f1' },
          { label: 'Analisar Vídeo', icon: Video, path: '/video', color: '#22d3ee' },
          { label: 'Gerar Ideias', icon: Lightbulb, path: '/ideias', color: '#f59e0b' },
        ].map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl border border-[rgba(170,59,255,0.1)] bg-[rgba(15,15,26,0.5)] hover:border-[rgba(170,59,255,0.3)] hover:bg-[rgba(170,59,255,0.05)] transition-all text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${action.color}18` }}
              >
                <Icon size={15} style={{ color: action.color }} />
              </div>
              <span className="text-sm text-[#c4c4d4] font-medium">{action.label}</span>
            </motion.button>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
