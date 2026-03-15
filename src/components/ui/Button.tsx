import React from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white hover:opacity-90 shadow-[0_0_20px_rgba(170,59,255,0.3)] hover:shadow-[0_0_30px_rgba(170,59,255,0.5)]',
  secondary:
    'bg-[rgba(15,15,26,0.7)] backdrop-blur-sm border border-[rgba(170,59,255,0.2)] text-[#c4c4d4] hover:border-[rgba(170,59,255,0.5)] hover:bg-[rgba(170,59,255,0.08)]',
  ghost:
    'bg-transparent text-[#c4c4d4] hover:text-white hover:bg-[rgba(170,59,255,0.1)]',
}

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#aa3bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080f] disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
