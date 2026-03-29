import type { PlanName, PlanFeatures } from '../types/auth'

export interface PlanConfig {
  name: PlanName
  display_name: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  api_limit_daily: number
  api_limit_monthly: number
  features: PlanFeatures
}

export const PLAN_CONFIG: Record<PlanName, PlanConfig> = {
  starter: {
    name: 'starter',
    display_name: 'Starter',
    description: 'Ideal para quem está começando a criar anúncios.',
    color: '#9ca3af',
    bgColor: 'rgba(156,163,175,0.1)',
    borderColor: 'rgba(156,163,175,0.2)',
    api_limit_daily: 50,
    api_limit_monthly: 50,
    features: {
      scriptGenerator: true,
      copyGenerator: true,
      videoAnalyzer: false,
      creativeIdeas: false,
      winnersLibrary: false,
      trendsRadar: false,
      projectHistory: true,
      maxScripts: 10,
      maxCopies: 10,
      maxAnalyses: 0,
      maxIdeas: 0,
    },
  },
  pro: {
    name: 'pro',
    display_name: 'Pro',
    description: 'Para criadores avançados que precisam de mais ferramentas.',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.1)',
    borderColor: 'rgba(99,102,241,0.25)',
    api_limit_daily: 200,
    api_limit_monthly: 200,
    features: {
      scriptGenerator: true,
      copyGenerator: true,
      videoAnalyzer: true,
      creativeIdeas: true,
      winnersLibrary: true,
      trendsRadar: false,
      projectHistory: true,
      maxScripts: 50,
      maxCopies: 50,
      maxAnalyses: 20,
      maxIdeas: 20,
    },
  },
  elite: {
    name: 'elite',
    display_name: 'Elite',
    description: 'Acesso total ilimitado a todas as ferramentas.',
    color: '#aa3bff',
    bgColor: 'rgba(170,59,255,0.1)',
    borderColor: 'rgba(170,59,255,0.3)',
    api_limit_daily: -1,
    api_limit_monthly: -1,
    features: {
      scriptGenerator: true,
      copyGenerator: true,
      videoAnalyzer: true,
      creativeIdeas: true,
      winnersLibrary: true,
      trendsRadar: true,
      projectHistory: true,
      maxScripts: -1,
      maxCopies: -1,
      maxAnalyses: -1,
      maxIdeas: -1,
    },
  },
}

export const PLAN_ORDER: PlanName[] = ['starter', 'pro', 'elite']

export function getPlanColor(planName: PlanName | string | null | undefined): string {
  if (!planName) return '#6b6b8a'
  return PLAN_CONFIG[planName as PlanName]?.color ?? '#6b6b8a'
}

export function getPlanBgColor(planName: PlanName | string | null | undefined): string {
  if (!planName) return 'rgba(107,107,138,0.1)'
  return PLAN_CONFIG[planName as PlanName]?.bgColor ?? 'rgba(107,107,138,0.1)'
}

export function getPlanBorderColor(planName: PlanName | string | null | undefined): string {
  if (!planName) return 'rgba(107,107,138,0.2)'
  return PLAN_CONFIG[planName as PlanName]?.borderColor ?? 'rgba(107,107,138,0.2)'
}

export function getPlanDisplayName(planName: PlanName | string | null | undefined): string {
  if (!planName) return 'Sem Plano'
  return PLAN_CONFIG[planName as PlanName]?.display_name ?? planName
}

export function getFeatureLabel(feature: keyof PlanFeatures): string {
  const labels: Record<keyof PlanFeatures, string> = {
    scriptGenerator: 'Gerador de Roteiros',
    copyGenerator: 'Gerador de Copy',
    videoAnalyzer: 'Analisador de Vídeo',
    creativeIdeas: 'Ideias de Criativos',
    winnersLibrary: 'Biblioteca de Anúncios',
    trendsRadar: 'Radar de Tendências',
    projectHistory: 'Histórico de Projetos',
    maxScripts: 'Máx. Roteiros',
    maxCopies: 'Máx. Copies',
    maxAnalyses: 'Máx. Análises',
    maxIdeas: 'Máx. Ideias',
  }
  return labels[feature] ?? feature
}

export function getPlanThatUnlocksFeature(feature: keyof PlanFeatures): PlanName | null {
  for (const planName of PLAN_ORDER) {
    const plan = PLAN_CONFIG[planName]
    const val = plan.features[feature]
    if (val === true || (typeof val === 'number' && val !== 0)) {
      return planName
    }
  }
  return null
}
