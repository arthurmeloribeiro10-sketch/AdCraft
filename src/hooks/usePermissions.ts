import { useAuth } from '../context/AuthContext'
import type { PlanFeatures } from '../types/auth'
import { checkFeatureAccess, checkApiQuota } from '../lib/permissions'

export function usePermissions() {
  const { profile, isAdmin } = useAuth()

  const plan = profile?.plan ?? null
  const dailyLimit = plan?.api_limit_daily ?? 0
  const monthlyLimit = plan?.api_limit_monthly ?? 0
  const apiCallsToday = profile?.api_calls_today ?? 0
  const apiCallsMonth = profile?.api_calls_month ?? 0

  const usagePercentToday =
    dailyLimit > 0 ? Math.min(100, Math.round((apiCallsToday / dailyLimit) * 100)) : 0

  const usagePercentMonth =
    monthlyLimit > 0
      ? Math.min(100, Math.round((apiCallsMonth / monthlyLimit) * 100))
      : 0

  return {
    isAdmin,
    canAccess: (feature: keyof PlanFeatures): boolean =>
      checkFeatureAccess(profile, feature),
    hasApiQuota: (): boolean => checkApiQuota(profile),
    planName: plan?.name ?? null,
    planDisplayName: plan?.display_name ?? null,
    apiCallsToday,
    apiCallsMonth,
    dailyLimit,
    monthlyLimit,
    usagePercentToday,
    usagePercentMonth,
    isActive: profile?.is_active ?? false,
  }
}
