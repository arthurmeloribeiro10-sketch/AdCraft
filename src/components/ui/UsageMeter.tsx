import { cn } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'

interface UsageMeterProps {
  compact?: boolean
  className?: string
}

function getColor(percent: number): string {
  if (percent >= 90) return '#ef4444'
  if (percent >= 70) return '#f59e0b'
  return '#22c55e'
}

interface MeterBarProps {
  label: string
  value: number
  limit: number
  percent: number
  compact?: boolean
}

function MeterBar({ label, value, limit, percent, compact }: MeterBarProps) {
  const color = getColor(percent)

  if (compact) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#6b6b8a]">{label}</span>
          <span className="text-[9px] font-medium" style={{ color }}>
            {value}/{limit}
          </span>
        </div>
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6b6b8a]">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {value}/{limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      {percent >= 90 && (
        <p className="text-[10px] text-red-400">
          {percent >= 100 ? 'Limite atingido!' : 'Quase no limite!'}
        </p>
      )}
    </div>
  )
}

export default function UsageMeter({ compact = false, className }: UsageMeterProps) {
  const {
    apiCallsToday,
    apiCallsMonth,
    dailyLimit,
    monthlyLimit,
    usagePercentToday,
    usagePercentMonth,
  } = usePermissions()

  if (compact) {
    return (
      <div className={cn('flex flex-col gap-1.5 px-2 py-2', className)}>
        <MeterBar
          label="Hoje"
          value={apiCallsToday}
          limit={dailyLimit}
          percent={usagePercentToday}
          compact
        />
        <MeterBar
          label="Mês"
          value={apiCallsMonth}
          limit={monthlyLimit}
          percent={usagePercentMonth}
          compact
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h4 className="text-xs font-semibold text-[#c4c4d4] mb-3">Uso de API</h4>
        <div className="flex flex-col gap-3">
          <MeterBar
            label="Chamadas hoje"
            value={apiCallsToday}
            limit={dailyLimit}
            percent={usagePercentToday}
          />
          <MeterBar
            label="Chamadas este mês"
            value={apiCallsMonth}
            limit={monthlyLimit}
            percent={usagePercentMonth}
          />
        </div>
      </div>
    </div>
  )
}
