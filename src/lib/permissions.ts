import type { UserProfile, PlanFeatures, PlanName } from '../types/auth'
import { getPlanDisplayName, getPlanThatUnlocksFeature, getFeatureLabel, PLAN_ORDER } from './planConfig'

export function checkFeatureAccess(
  profile: UserProfile | null,
  feature: keyof PlanFeatures
): boolean {
  if (!profile) return false
  if (!profile.is_active) return false
  if (profile.role === 'admin') return true

  const planFeatures = profile.plan?.features
  if (!planFeatures) return false

  const val = planFeatures[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  return false
}

export function checkApiQuota(profile: UserProfile | null): boolean {
  if (!profile) return false
  if (!profile.is_active) return false
  if (profile.role === 'admin') return true

  const plan = profile.plan
  if (!plan) return false

  // Check daily limit
  if (profile.api_calls_today >= plan.api_limit_daily) return false
  // Check monthly limit
  if (profile.api_calls_month >= plan.api_limit_monthly) return false

  return true
}

export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'admin' && profile?.is_active === true
}

export function canViewUser(
  actorProfile: UserProfile | null,
  targetUserId: string
): boolean {
  if (!actorProfile) return false
  if (actorProfile.role === 'admin') return true
  return actorProfile.id === targetUserId
}

export function canManageUsers(profile: UserProfile | null): boolean {
  return isAdmin(profile)
}

export function getPlanLevel(planName: PlanName | string | null): number {
  if (!planName) return -1
  return PLAN_ORDER.indexOf(planName as PlanName)
}

export function meetsMinimumPlan(
  profile: UserProfile | null,
  minimumPlan: PlanName
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true

  const userPlanName = profile.plan?.name
  if (!userPlanName) return false

  const userLevel = getPlanLevel(userPlanName)
  const requiredLevel = getPlanLevel(minimumPlan)

  return userLevel >= requiredLevel
}

export function getFeatureBlockMessage(
  feature: keyof PlanFeatures,
  currentPlan: PlanName | null
): string {
  const featureLabel = getFeatureLabel(feature)
  const requiredPlan = getPlanThatUnlocksFeature(feature)

  if (!requiredPlan) {
    return `O recurso "${featureLabel}" não está disponível.`
  }

  const currentPlanDisplay = currentPlan ? getPlanDisplayName(currentPlan) : 'Sem Plano'
  const requiredPlanDisplay = getPlanDisplayName(requiredPlan)

  return `O recurso "${featureLabel}" requer o plano ${requiredPlanDisplay}. Você está no plano ${currentPlanDisplay}. Faça um upgrade para desbloquear.`
}

export function getApiQuotaMessage(profile: UserProfile | null): string {
  if (!profile) return 'Você precisa estar logado para usar a API.'
  if (!profile.is_active) return 'Sua conta está inativa. Entre em contato com o suporte.'

  const plan = profile.plan
  if (!plan) return 'Você não possui um plano ativo.'

  if (profile.api_calls_today >= plan.api_limit_daily) {
    return `Você atingiu o limite diário de ${plan.api_limit_daily} chamadas de API. Seu limite será redefinido amanhã.`
  }

  if (profile.api_calls_month >= plan.api_limit_monthly) {
    return `Você atingiu o limite mensal de ${plan.api_limit_monthly} chamadas de API. Faça um upgrade para o plano Elite para aumentar seu limite.`
  }

  return ''
}
