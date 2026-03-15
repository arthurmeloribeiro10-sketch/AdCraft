import React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[rgba(255,255,255,0.08)] text-[#c4c4d4] border border-[rgba(255,255,255,0.1)]',
  success: 'bg-[rgba(34,197,94,0.12)] text-emerald-400 border border-[rgba(34,197,94,0.2)]',
  warning: 'bg-[rgba(234,179,8,0.12)] text-yellow-400 border border-[rgba(234,179,8,0.2)]',
  error: 'bg-[rgba(239,68,68,0.12)] text-red-400 border border-[rgba(239,68,68,0.2)]',
  purple: 'bg-[rgba(170,59,255,0.12)] text-[#aa3bff] border border-[rgba(170,59,255,0.25)]',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
