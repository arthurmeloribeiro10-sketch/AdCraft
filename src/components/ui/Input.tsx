import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#c4c4d4]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg px-3.5 py-2.5 text-sm text-[#c4c4d4] placeholder:text-[#6b6b8a]',
          'bg-[rgba(15,15,26,0.8)] backdrop-blur-sm',
          'border border-[rgba(170,59,255,0.12)]',
          'outline-none transition-all duration-200',
          'focus:border-[rgba(170,59,255,0.5)] focus:ring-1 focus:ring-[rgba(170,59,255,0.3)]',
          'hover:border-[rgba(170,59,255,0.25)]',
          error && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
