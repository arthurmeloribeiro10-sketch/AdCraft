import React from 'react'
import { Lock, ArrowRight, Zap, Star, Crown } from 'lucide-react'
import type { PlanFeatures, PlanName } from '../../types/auth'
import {
  getFeatureLabel,
  getPlanDisplayName,
  getPlanThatUnlocksFeature,
  getPlanColor,
  getPlanBgColor,
} from '../../lib/planConfig'
import Button from './Button'

interface UpgradePromptProps {
  feature?: keyof PlanFeatures
  currentPlan: PlanName | string | null | undefined
  requiredPlan?: PlanName
  onUpgrade?: () => void
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: Zap,
  pro: Star,
  elite: Crown,
}

export default function UpgradePrompt({
  feature,
  currentPlan,
  requiredPlan,
  onUpgrade,
}: UpgradePromptProps) {
  const needed = requiredPlan ?? (feature ? getPlanThatUnlocksFeature(feature) : null)
  const featureLabel = feature ? getFeatureLabel(feature) : null
  const neededDisplay = needed ? getPlanDisplayName(needed) : null
  const currentDisplay = currentPlan ? getPlanDisplayName(currentPlan) : 'Sem Plano'
  const color = needed ? getPlanColor(needed) : '#aa3bff'
  const bgColor = needed ? getPlanBgColor(needed) : 'rgba(170,59,255,0.1)'
  const PlanIcon = needed ? (PLAN_ICONS[needed] ?? Crown) : Crown

  return (
    <div className="glass glow-accent p-8 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <Lock size={28} style={{ color }} />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center border-2 border-[#08080f]"
            style={{ backgroundColor: bgColor }}
          >
            <PlanIcon size={14} style={{ color }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">
        {featureLabel ? `${featureLabel} bloqueado` : 'Recurso bloqueado'}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#6b6b8a] mb-2 leading-relaxed">
        {featureLabel
          ? `O recurso "${featureLabel}" não está disponível no plano`
          : 'Este recurso não está disponível no plano'}
        {' '}
        <span className="text-[#c4c4d4] font-medium">{currentDisplay}</span>.
      </p>

      {neededDisplay && (
        <p className="text-sm text-[#6b6b8a] mb-6">
          Faça upgrade para o plano{' '}
          <span className="font-semibold" style={{ color }}>
            {neededDisplay}
          </span>{' '}
          para desbloquear.
        </p>
      )}

      {/* Plan comparison */}
      {needed && (
        <div
          className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl mb-6 border"
          style={{ backgroundColor: bgColor, borderColor: color + '40' }}
        >
          <div className="text-center">
            <p className="text-xs text-[#6b6b8a] mb-0.5">Plano atual</p>
            <p className="text-sm font-semibold text-[#c4c4d4]">{currentDisplay}</p>
          </div>
          <ArrowRight size={16} style={{ color }} />
          <div className="text-center">
            <p className="text-xs text-[#6b6b8a] mb-0.5">Necessário</p>
            <p className="text-sm font-semibold" style={{ color }}>
              {neededDisplay}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={onUpgrade}
        className="w-full"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, #6366f1 100%)`,
        }}
      >
        <PlanIcon size={15} />
        Fazer Upgrade
        <ArrowRight size={14} />
      </Button>

      <p className="text-xs text-[#6b6b8a] mt-3">
        Entre em contato com o administrador para fazer upgrade.
      </p>
    </div>
  )
}
