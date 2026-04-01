import { supabase, isSupabaseConfigured } from './supabase'

// Feature keys — must match system_settings feature_token_costs keys
export type FeatureKey =
  | 'copyGenerator'
  | 'scriptGenerator'
  | 'creativeIdeas'
  | 'winnersLibrary'
  | 'videoAnalyzer'
  | 'trendsRadar'

// Default costs (mirrors DB; used for display only — real validation is server-side)
export const FEATURE_TOKEN_COSTS: Record<FeatureKey, number> = {
  copyGenerator:   5,
  scriptGenerator: 10,
  creativeIdeas:   15,
  winnersLibrary:  2,
  videoAnalyzer:   10,
  trendsRadar:     5,
}

export const FEATURE_NAMES: Record<FeatureKey, string> = {
  copyGenerator:   'Copy',
  scriptGenerator: 'Roteiro',
  creativeIdeas:   'Ideias',
  winnersLibrary:  'Biblioteca',
  videoAnalyzer:   'Análise de Vídeo',
  trendsRadar:     'Radar de Tendências',
}

export interface TokenStatus {
  used: number
  limit: number
  unlimited: boolean
  remaining: number
  reset_date: string | null
  plan_name: string
}

export interface ConsumeResult {
  success: boolean
  cost?: number
  used?: number
  limit?: number
  remaining?: number
  unlimited?: boolean
  error?: 'token_limit_reached' | 'not_authenticated' | 'profile_not_found' | 'unknown'
}

/** Deduct tokens for a feature. Must be called before AI generation. */
export async function consumeTokens(feature: FeatureKey): Promise<ConsumeResult> {
  // Dev mode: skip token check when Supabase is not configured
  if (!isSupabaseConfigured) {
    return { success: true, unlimited: true, cost: FEATURE_TOKEN_COSTS[feature] }
  }
  const { data, error } = await supabase.rpc('consume_tokens', { p_feature: feature })
  if (error) {
    console.error('consumeTokens error:', error)
    return { success: false, error: 'unknown' }
  }
  return (data ?? { success: false, error: 'unknown' }) as ConsumeResult
}

/** Get current token usage for the logged-in user. */
export async function getTokenStatus(): Promise<TokenStatus | null> {
  const { data, error } = await supabase.rpc('get_token_status')
  if (error) { console.error('getTokenStatus error:', error); return null }
  return data as TokenStatus
}

/** Human-readable error for token limit reached. */
export function tokenLimitMessage(result: ConsumeResult, planName?: string): string {
  if (result.error === 'token_limit_reached') {
    const remaining = result.remaining ?? 0
    const plan = planName ?? 'atual'
    if (remaining === 0) {
      return `Você esgotou os tokens do plano ${plan} este mês. Renove ou faça upgrade do plano para continuar gerando.`
    }
    return `Tokens insuficientes. Esta ação custa ${result.cost} tokens, mas você tem apenas ${remaining} restantes no plano ${plan}.`
  }
  return 'Erro ao verificar tokens. Tente novamente.'
}

/** Admin: fetch current feature token costs from DB. */
export async function adminGetFeatureCosts(): Promise<Record<FeatureKey, number>> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'feature_token_costs')
    .single()
  return (data?.value ?? FEATURE_TOKEN_COSTS) as Record<FeatureKey, number>
}

/** Admin: update feature token costs. */
export async function adminUpdateFeatureCosts(
  costs: Record<FeatureKey, number>
): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_update_feature_costs', {
    p_costs: costs,
  })
  if (error) return false
  return (data as { success: boolean })?.success ?? false
}

/** Admin: reset a user's monthly token counter. */
export async function adminResetUserTokens(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_reset_user_tokens', {
    p_user_id: userId,
  })
  if (error) return false
  return (data as { success: boolean })?.success ?? false
}
