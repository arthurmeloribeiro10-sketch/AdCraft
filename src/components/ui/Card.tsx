import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export default function Card({ children, className, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        'glass p-6',
        glow && 'glow-accent',
        className
      )}
    >
      {children}
    </div>
  )
}
