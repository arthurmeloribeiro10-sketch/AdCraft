import { supabase, isSupabaseConfigured } from './supabase'
import type { AuditAction } from '../types/auth'

export async function logAudit(params: {
  action: AuditAction
  actorId?: string
  actorEmail?: string
  targetUserId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (!isSupabaseConfigured) return

  try {
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId ?? null,
      actor_email: params.actorEmail ?? null,
      target_user_id: params.targetUserId ?? null,
      action: params.action,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? {},
    })
  } catch {
    // Audit logging should never break the main flow
  }
}

export const audit = {
  accountCreated(userId: string, email: string) {
    return logAudit({
      action: 'account.created',
      actorId: userId,
      actorEmail: email,
      targetUserId: userId,
      resourceType: 'user',
      resourceId: userId,
      metadata: { email },
    })
  },

  login(userId: string, email: string) {
    return logAudit({
      action: 'auth.login',
      actorId: userId,
      actorEmail: email,
      resourceType: 'session',
      metadata: { email },
    })
  },

  logout(userId: string, email: string) {
    return logAudit({
      action: 'auth.logout',
      actorId: userId,
      actorEmail: email,
      resourceType: 'session',
      metadata: { email },
    })
  },

  loginFailed(email: string, reason?: string) {
    return logAudit({
      action: 'auth.login_failed',
      actorEmail: email,
      resourceType: 'session',
      metadata: { email, reason: reason ?? 'invalid_credentials' },
    })
  },

  userCreatedByAdmin(
    actorId: string,
    actorEmail: string,
    newUserId: string,
    newEmail: string
  ) {
    return logAudit({
      action: 'user.created_by_admin',
      actorId,
      actorEmail,
      targetUserId: newUserId,
      resourceType: 'user',
      resourceId: newUserId,
      metadata: { new_email: newEmail },
    })
  },

  planChanged(
    actorId: string,
    actorEmail: string,
    targetId: string,
    oldPlan: string,
    newPlan: string
  ) {
    return logAudit({
      action: 'user.plan_changed',
      actorId,
      actorEmail,
      targetUserId: targetId,
      resourceType: 'user',
      resourceId: targetId,
      metadata: { old_plan: oldPlan, new_plan: newPlan },
    })
  },

  roleChanged(
    actorId: string,
    actorEmail: string,
    targetId: string,
    oldRole: string,
    newRole: string
  ) {
    return logAudit({
      action: 'user.role_changed',
      actorId,
      actorEmail,
      targetUserId: targetId,
      resourceType: 'user',
      resourceId: targetId,
      metadata: { old_role: oldRole, new_role: newRole },
    })
  },

  accessToggled(
    actorId: string,
    actorEmail: string,
    targetId: string,
    isActive: boolean
  ) {
    return logAudit({
      action: 'user.access_toggled',
      actorId,
      actorEmail,
      targetUserId: targetId,
      resourceType: 'user',
      resourceId: targetId,
      metadata: { is_active: isActive },
    })
  },

  tokenCreated(userId: string, tokenId: string) {
    return logAudit({
      action: 'token.created',
      actorId: userId,
      resourceType: 'token',
      resourceId: tokenId,
      metadata: { token_id: tokenId },
    })
  },

  tokenRevoked(
    actorId: string,
    actorEmail: string,
    tokenId: string,
    ownerId: string
  ) {
    return logAudit({
      action: 'token.revoked',
      actorId,
      actorEmail,
      targetUserId: ownerId,
      resourceType: 'token',
      resourceId: tokenId,
      metadata: { token_id: tokenId, owner_id: ownerId },
    })
  },

  apiKeyUpdated(actorId: string, actorEmail: string) {
    return logAudit({
      action: 'api_key.updated',
      actorId,
      actorEmail,
      resourceType: 'api_key',
      metadata: {},
    })
  },

  apiCalled(userId: string, endpoint: string, tokensUsed: number) {
    return logAudit({
      action: 'api.called',
      actorId: userId,
      resourceType: 'api',
      resourceId: endpoint,
      metadata: { endpoint, tokens_used: tokensUsed },
    })
  },

  apiLimitReached(userId: string, planName: string) {
    return logAudit({
      action: 'api.limit_reached',
      actorId: userId,
      resourceType: 'api',
      metadata: { plan_name: planName },
    })
  },

  profileUpdated(userId: string, email: string, changes: Record<string, unknown>) {
    return logAudit({
      action: 'profile.updated',
      actorId: userId,
      actorEmail: email,
      targetUserId: userId,
      resourceType: 'user',
      resourceId: userId,
      metadata: { changes },
    })
  },

  passwordChanged(userId: string, email: string) {
    return logAudit({
      action: 'password.changed',
      actorId: userId,
      actorEmail: email,
      resourceType: 'user',
      resourceId: userId,
      metadata: {},
    })
  },
}
