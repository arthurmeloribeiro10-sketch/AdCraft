import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { audit } from '../lib/audit'
import { checkAndResetUsage } from '../lib/apiUsage'
import { checkFeatureAccess, checkApiQuota } from '../lib/permissions'
import { validatePlanKey as validatePlanKeyLib, validatePlanKeyAuto, checkRegistrationAllowed, planKeyErrorMessage } from '../lib/planKey'
import type { UserProfile, PlanFeatures, AuthContextValue } from '../types/auth'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ── Mock profile for dev mode (no Supabase) ────────────────────────────────────
const DEV_PROFILE: UserProfile = {
  id: 'dev-user',
  email: 'dev@adcraft.app',
  full_name: 'Dev Admin',
  role: 'admin',
  plan_id: 'dev-elite',
  plan: {
    id: 'dev-elite',
    name: 'elite',
    display_name: 'Elite',
    api_limit_daily: 999,
    api_limit_monthly: 9999,
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
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  is_active: true,
  api_calls_today: 0,
  api_calls_month: 0,
  api_reset_daily: new Date(Date.now() + 86400000).toISOString(),
  api_reset_monthly: new Date(Date.now() + 86400000 * 30).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEV_USER: User = {
  id: 'dev-user',
  email: 'dev@adcraft.app',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { full_name: 'Dev Admin' },
  identities: [],
  factors: [],
} as unknown as User

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, email, full_name, role, plan_id, is_active,
      api_calls_today, api_calls_month,
      api_reset_daily, api_reset_monthly,
      created_at, updated_at,
      plan:plans (
        id, name, display_name, api_limit_daily, api_limit_monthly,
        features, is_active, sort_order, created_at, updated_at
      )
    `
    )
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan

  return {
    ...data,
    plan: plan ?? null,
  } as UserProfile
}

async function upsertProfile(user: User): Promise<UserProfile | null> {
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuário'

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name: fullName,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (error) {
    console.error('Failed to upsert profile:', error)
  }

  return fetchProfile(user.id)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured) return

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      setProfile(null)
      return
    }

    const p = await fetchProfile(currentUser.id)
    if (p) {
      const refreshed = await checkAndResetUsage(p)
      setProfile(refreshed)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(DEV_USER)
      setProfile(DEV_PROFILE)
      setIsLoading(false)
      return
    }

    let mounted = true

    // Safety net: force-clear loading after 6s no matter what
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('AuthContext: safety timeout fired — forcing isLoading=false')
        setIsLoading(false)
      }
    }, 6000)

    // Initial session check using getUser() — avoids localStorage lock issues
    const initAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        if (error) console.warn('getUser error (expected when no session):', error.message)
        if (!mounted) return
        if (currentUser) {
          setUser(currentUser)
          let p = await fetchProfile(currentUser.id)
          if (!p) p = await upsertProfile(currentUser)
          if (p) {
            const refreshed = await checkAndResetUsage(p)
            if (mounted) setProfile(refreshed)
          }
        }
      } catch (err) {
        console.error('AuthContext init error:', err)
      } finally {
        clearTimeout(safetyTimer)
        if (mounted) setIsLoading(false)
      }
    }

    initAuth()

    // Subscribe for subsequent auth events (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (!mounted) return
          setUser(session.user)
          try {
            let p = await fetchProfile(session.user.id)
            if (!p) p = await upsertProfile(session.user)
            if (p) {
              const refreshed = await checkAndResetUsage(p)
              if (mounted) setProfile(refreshed)
            }
          } catch (err) {
            console.error('AuthContext SIGNED_IN error:', err)
          }
        } else if (event === 'SIGNED_OUT') {
          if (!mounted) return
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (mounted) setUser(session.user)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      setUser(DEV_USER)
      setProfile(DEV_PROFILE)
      return { error: null }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        await audit.loginFailed(email, error.message)
        return { error: 'Email ou senha inválidos.' }
      }

      if (data.user) {
        await audit.login(data.user.id, email)

        // Check if profile is active
        const p = await fetchProfile(data.user.id)
        if (p && !p.is_active) {
          await supabase.auth.signOut()
          return { error: 'Sua conta foi desativada. Entre em contato com o suporte.' }
        }
      }

      return { error: null }
    } catch {
      await audit.loginFailed(email, 'unexpected_error')
      return { error: 'Erro inesperado. Tente novamente.' }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    planKey?: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      setUser(DEV_USER)
      setProfile(DEV_PROFILE)
      return { error: null }
    }

    try {
      // Check registration allowed
      const regCheck = await checkRegistrationAllowed(email)
      if (!regCheck.allowed) {
        if (regCheck.reason === 'registration_disabled') {
          return { error: 'O cadastro está temporariamente desativado pelo administrador.' }
        }
        if (regCheck.reason === 'email_blocked') {
          return { error: 'Este email não tem permissão para se cadastrar.' }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName ?? email.split('@')[0] },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado.' }
        }
        return { error: error.message }
      }

      if (data.user) {
        await audit.accountCreated(data.user.id, email)

        // If plan key provided, validate it to assign the plan
        if (planKey) {
          const pkResult = await validatePlanKeyAuto(planKey)
          if (!pkResult.success) {
            // User created but plan key failed — sign out and return error
            await supabase.auth.signOut()
            return { error: `Conta criada mas chave do plano inválida: ${planKeyErrorMessage(pkResult.error)}. Faça login e tente novamente.` }
          }
          // Refresh profile so the correct plan is reflected in state
          // (trigger assigns starter first; key validation upgrades it)
          await refreshProfile()
        }
      }

      return { error: null }
    } catch {
      return { error: 'Erro inesperado. Tente novamente.' }
    }
  }

  const validatePlanKey = async (
    planName: string,
    planKey: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await validatePlanKeyLib(planName, planKey)
    if (result.success) {
      // Refresh profile so plan change is reflected
      await refreshProfile()
      return { success: true }
    }
    return { success: false, error: planKeyErrorMessage(result.error) }
  }

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null)
      setProfile(null)
      return
    }

    if (user && profile) {
      await audit.logout(user.id, profile.email)
    }

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin' && profile?.is_active === true

  const canAccess = (feature: keyof PlanFeatures): boolean => {
    return checkFeatureAccess(profile, feature)
  }

  const hasApiQuota = (): boolean => {
    return checkApiQuota(profile)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        canAccess,
        hasApiQuota,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        validatePlanKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext }
