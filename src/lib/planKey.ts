import { supabase } from './supabase'

export type PlanKeyError =
  | 'not_authenticated'
  | 'invalid_plan'
  | 'no_active_key'
  | 'key_expired'
  | 'invalid_key'

export type ValidatePlanKeyResult =
  | { success: true; planName: string; planDisplay?: string }
  | { success: false; error: PlanKeyError }

export type RegistrationAllowedResult =
  | { allowed: true; reason: null }
  | { allowed: false; reason: 'registration_disabled' | 'email_blocked' }

export interface PlanKeyStatus {
  plan_id: string
  plan_name: string
  plan_display_name: string
  has_active_key: boolean
  expires_at: string | null
  created_at: string | null
  is_expired: boolean
  notes: string | null
}

export interface BlockedEmail {
  id: string
  email: string
  reason: string | null
  created_at: string
}

export async function validatePlanKey(
  planName: string,
  planKey: string
): Promise<ValidatePlanKeyResult> {
  const { data, error } = await supabase.rpc('validate_plan_key', {
    p_plan_name: planName,
    p_key: planKey,
  })
  if (error) {
    console.error('validatePlanKey error:', error)
    return { success: false, error: 'invalid_key' }
  }
  return data as ValidatePlanKeyResult
}

export async function checkRegistrationAllowed(
  email: string
): Promise<RegistrationAllowedResult> {
  const { data, error } = await supabase.rpc('check_registration_allowed', {
    p_email: email,
  })
  if (error) {
    console.error('checkRegistrationAllowed error:', error)
    return { allowed: true, reason: null } // fail open
  }
  return data as RegistrationAllowedResult
}

export async function adminGetPlanKeyStatus(): Promise<PlanKeyStatus[]> {
  const { data, error } = await supabase.rpc('admin_get_plan_key_status')
  if (error) { console.error('adminGetPlanKeyStatus:', error); return [] }
  return (data as PlanKeyStatus[]) || []
}

export async function adminSetPlanKey(
  planName: string,
  newKey: string,
  expiresAt: string | null = null,
  notes: string | null = null
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_set_plan_key', {
    p_plan_name: planName,
    p_new_key: newKey,
    p_expires_at: expiresAt,
    p_notes: notes,
  })
  if (error) return { success: false, error: error.message }
  return data as { success: boolean; error?: string }
}

export async function adminGetRegistrationEnabled(): Promise<boolean> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'registration_enabled')
    .single()
  if (!data) return true
  return data.value === true
}

export async function adminToggleRegistration(enabled: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_update_system_setting', {
    p_key: 'registration_enabled',
    p_value: enabled,
  })
  if (error) return false
  return (data as { success: boolean })?.success ?? false
}

export async function adminGetBlockedEmails(): Promise<BlockedEmail[]> {
  const { data, error } = await supabase
    .from('blocked_emails')
    .select('id, email, reason, created_at')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function adminBlockEmail(email: string, reason?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_block_email', {
    p_email: email,
    p_reason: reason ?? null,
  })
  if (error) return false
  return (data as { success: boolean })?.success ?? false
}

export async function adminUnblockEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_unblock_email', {
    p_email: email,
  })
  if (error) return false
  return (data as { success: boolean })?.success ?? false
}

/** Auto-detects which plan the key belongs to and assigns it to the current user. */
export async function validatePlanKeyAuto(
  planKey: string
): Promise<ValidatePlanKeyResult & { planDisplay?: string }> {
  const { data, error } = await supabase.rpc('validate_plan_key_auto', {
    p_key: planKey,
  })
  if (error) {
    console.error('validatePlanKeyAuto error:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint)
    return { success: false, error: 'invalid_key' }
  }
  const result = data as { success: boolean; plan_name?: string; plan_display?: string; error?: PlanKeyError }
  if (result.success) {
    return { success: true, planName: result.plan_name!, planDisplay: result.plan_display }
  }
  return { success: false, error: result.error ?? 'invalid_key' }
}

export function planKeyErrorMessage(error: PlanKeyError): string {
  const messages: Record<PlanKeyError, string> = {
    not_authenticated:  'Você precisa estar autenticado.',
    invalid_plan:       'Plano inválido.',
    no_active_key:      'Não há chave ativa para este plano.',
    key_expired:        'A chave deste plano expirou. Solicite uma nova ao administrador.',
    invalid_key:        'Chave do plano incorreta.',
  }
  return messages[error] ?? 'Erro ao validar chave do plano.'
}
