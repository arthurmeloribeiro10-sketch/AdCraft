import React from 'react'
import { Zap, Star, Crown } from 'lucide-react'
import type { PlanName } from '../../types/auth'
import { getPlanColor, getPlanBgColor, getPlanBorderColor, getPlanDisplayName } from '../../lib/planConfig'
import { cn } from '../../lib/utils'

interface PlanBadgeProps {
  plan: PlanName | string | null | undefined
  variant?: 'compact' | 'full'
  className?: string
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: Zap,
  pro: Star,
  elite: Crown,
}

export default function PlanBadge({ plan, variant = 'compact', className }: PlanBadgeProps) {
  const color = getPlanColor(plan)
  const bgColor = getPlanBgColor(plan)
  const borderColor = getPlanBorderColor(plan)
  const displayName = getPlanDisplayName(plan)
  const Icon = plan ? (PLAN_ICONS[plan as string] ?? Zap) : Zap

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
          className
        )}
        style={{
          color,
          backgroundColor: bgColor,
          borderColor,
        }}
      >
        <Icon size={9} />
        {displayName}
      </span>
    )
  }

  // Full variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border',
        className
      )}
      style={{
        color,
        backgroundColor: bgColor,
        borderColor,
      }}
    >
      <Icon size={14} />
      <div>
        <p className="text-xs font-semibold leading-none">{displayName}</p>
        <p className="text-[10px] opacity-70 leading-none mt-0.5">Plano atual</p>
      </div>
    </div>
  )
}
