import { useAuth } from '../../context/AuthContext'

interface UsageMeterProps {
  compact?: boolean
}

export default function UsageMeter({ compact = false }: UsageMeterProps) {
  const { profile } = useAuth()

  if (!profile?.plan) return null

  const limit   = profile.plan.api_limit_monthly
  const used    = profile.api_calls_month ?? 0
  const unlimited = limit === -1
  const remaining = unlimited ? Infinity : Math.max(limit - used, 0)
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100)

  const barColor =
    unlimited ? '#aa3bff' :
    pct >= 90  ? '#ef4444' :
    pct >= 70  ? '#f59e0b' :
    '#aa3bff'

  if (compact) {
    return (
      <div className="space-y-1.5 px-3 py-2 rounded-xl" style={{ background: '#08080f' }}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium" style={{ color: '#6b6b8a' }}>Tokens</span>
          <span className="text-xs font-semibold" style={{ color: unlimited ? '#aa3bff' : '#c4c4d4' }}>
            {unlimited ? '∞ ilimitados' : `${remaining} restantes`}
          </span>
        </div>
        {!unlimited && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: '#c4c4d4' }}>Tokens mensais</span>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {unlimited ? '∞' : `${used} / ${limit}`}
        </span>
      </div>

      {!unlimited && (
        <>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#6b6b8a' }}>
            <span>{remaining} tokens restantes</span>
            <span>{Math.round(pct)}% usado</span>
          </div>
        </>
      )}

      {unlimited && (
        <p className="text-xs" style={{ color: '#6b6b8a' }}>Plano Elite — uso ilimitado</p>
      )}
    </div>
  )
}
