import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'user'

export type PlanName = 'starter' | 'pro' | 'elite'

export type AuditAction =
  | 'account.created'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'user.created_by_admin'
  | 'user.plan_changed'
  | 'user.role_changed'
  | 'user.access_toggled'
  | 'token.created'
  | 'token.revoked'
  | 'api_key.updated'
  | 'api.called'
  | 'api.limit_reached'
  | 'profile.updated'
  | 'password.changed'

export interface PlanFeatures {
  scriptGenerator: boolean
  copyGenerator: boolean
  videoAnalyzer: boolean
  creativeIdeas: boolean
  winnersLibrary: boolean
  trendsRadar: boolean
  projectHistory: boolean
  maxScripts: number // -1 = unlimited
  maxCopies: number
  maxAnalyses: number
  maxIdeas: number
}

export interface Plan {
  id: string
  name: PlanName
  display_name: string
  api_limit_daily: number
  api_limit_monthly: number
  features: PlanFeatures
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  plan_id: string | null
  plan: Plan | null
  is_active: boolean
  api_calls_today: number
  api_calls_month: number
  api_reset_daily: string
  api_reset_monthly: string
  created_at: string
  updated_at: string
}

export interface UserToken {
  id: string
  user_id: string
  name: string
  token_prefix: string
  last_used_at: string | null
  expires_at: string | null
  is_revoked: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  target_user_id: string | null
  action: AuditAction
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  actor?: UserProfile
  target_user?: UserProfile
}

export interface ApiUsageLog {
  id: string
  user_id: string
  plan_id: string | null
  endpoint: string
  tokens_used: number
  created_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  canAccess: (feature: keyof PlanFeatures) => boolean
  hasApiQuota: () => boolean
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
