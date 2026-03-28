import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { PlanFeatures, PlanName } from '../../types/auth'
import { checkFeatureAccess, meetsMinimumPlan } from '../../lib/permissions'
import UpgradePrompt from '../ui/UpgradePrompt'

interface RouteGuardProps {
  children: React.ReactNode
}

/** Requires authentication. Redirects to /login if not authenticated. */
export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center animate-pulse">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#aa3bff] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Requires admin role. Redirects to / if not admin. */
export function AdminGuard({ children }: RouteGuardProps) {
  const { user, profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#aa3bff] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile && profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Profile still loading — wait
  if (!profile) return null

  return <>{children}</>
}

interface FeatureGuardProps {
  children: React.ReactNode
  feature: keyof PlanFeatures
}

/** Requires plan feature access. Shows upgrade prompt if blocked. */
export function FeatureGuard({ children, feature }: FeatureGuardProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return null

  const hasAccess = checkFeatureAccess(profile, feature)

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto mt-16 px-4">
        <UpgradePrompt
          feature={feature}
          currentPlan={profile?.plan?.name ?? null}
        />
      </div>
    )
  }

  return <>{children}</>
}

interface PlanGuardProps {
  children: React.ReactNode
  plan: PlanName
  feature?: keyof PlanFeatures
}

/** Requires minimum plan level. Shows upgrade prompt if below plan. */
export function PlanGuard({ children, plan, feature }: PlanGuardProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return null

  const hasAccess = meetsMinimumPlan(profile, plan)

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto mt-16 px-4">
        <UpgradePrompt
          feature={feature}
          currentPlan={profile?.plan?.name ?? null}
          requiredPlan={plan}
        />
      </div>
    )
  }

  return <>{children}</>
}
