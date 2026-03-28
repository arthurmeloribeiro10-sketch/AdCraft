import { supabase, isSupabaseConfigured } from './supabase'
import type { UserProfile } from '../types/auth'

export interface ApiUsageResult {
  success: boolean
  limitReached: boolean
  remaining: number
}

export interface ApiUsageStats {
  today: number
  month: number
  dailyLimit: number
  monthlyLimit: number
}

export async function incrementApiUsage(
  userId: string,
  planId: string | null,
  endpoint: string,
  tokensUsed: number = 1
): Promise<ApiUsageResult> {
  if (!isSupabaseConfigured) {
    return { success: true, limitReached: false, remaining: 999 }
  }

  try {
    // Use the DB function to check and reset limits first
    const { data: limits, error: limitsError } = await supabase
      .rpc('check_and_reset_api_limits', { p_user_id: userId })
      .single()

    if (limitsError || !limits) {
      return { success: false, limitReached: false, remaining: 0 }
    }

    const { api_calls_today, api_calls_month, daily_limit, monthly_limit } = limits as {
      api_calls_today: number
      api_calls_month: number
      daily_limit: number
      monthly_limit: number
    }

    // Check limits
    if (api_calls_today >= daily_limit || api_calls_month >= monthly_limit) {
      return {
        success: false,
        limitReached: true,
        remaining: Math.max(0, daily_limit - api_calls_today),
      }
    }

    // Increment counters
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        api_calls_today: api_calls_today + 1,
        api_calls_month: api_calls_month + 1,
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, limitReached: false, remaining: 0 }
    }

    // Log usage
    await supabase.from('api_usage_logs').insert({
      user_id: userId,
      plan_id: planId,
      endpoint,
      tokens_used: tokensUsed,
    })

    const remaining = daily_limit - api_calls_today - 1
    return { success: true, limitReached: false, remaining: Math.max(0, remaining) }
  } catch {
    return { success: false, limitReached: false, remaining: 0 }
  }
}

export async function getApiUsage(userId: string): Promise<ApiUsageStats> {
  if (!isSupabaseConfigured) {
    return { today: 0, month: 0, dailyLimit: 999, monthlyLimit: 9999 }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('api_calls_today, api_calls_month, plans(api_limit_daily, api_limit_monthly)')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { today: 0, month: 0, dailyLimit: 10, monthlyLimit: 100 }
    }

    const plan = Array.isArray(data.plans) ? data.plans[0] : data.plans

    return {
      today: data.api_calls_today ?? 0,
      month: data.api_calls_month ?? 0,
      dailyLimit: plan?.api_limit_daily ?? 10,
      monthlyLimit: plan?.api_limit_monthly ?? 100,
    }
  } catch {
    return { today: 0, month: 0, dailyLimit: 10, monthlyLimit: 100 }
  }
}

export async function resetDailyUsage(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return

  try {
    await supabase
      .from('profiles')
      .update({
        api_calls_today: 0,
        api_reset_daily: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq('id', userId)
  } catch {
    // ignore
  }
}

export async function checkAndResetUsage(
  profile: UserProfile
): Promise<UserProfile> {
  if (!isSupabaseConfigured) return profile

  const now = new Date()
  let updated = false
  const updates: Partial<UserProfile> = {}

  // Reset daily if needed
  if (now >= new Date(profile.api_reset_daily)) {
    updates.api_calls_today = 0
    updates.api_reset_daily = new Date(
      new Date(now).setHours(24, 0, 0, 0)
    ).toISOString()
    updated = true
  }

  // Reset monthly if needed
  if (now >= new Date(profile.api_reset_monthly)) {
    updates.api_calls_month = 0
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)
    nextMonth.setHours(0, 0, 0, 0)
    updates.api_reset_monthly = nextMonth.toISOString()
    updated = true
  }

  if (updated) {
    try {
      await supabase.from('profiles').update(updates).eq('id', profile.id)
      return { ...profile, ...updates }
    } catch {
      return profile
    }
  }

  return profile
}
