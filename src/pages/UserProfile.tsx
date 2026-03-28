import React, { useState, useCallback } from 'react'
import {
  User,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { audit } from '../lib/audit'
import type { UserToken } from '../types/auth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import PlanBadge from '../components/ui/PlanBadge'
import UsageMeter from '../components/ui/UsageMeter'
import { isSupabaseConfigured } from '../lib/supabase'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return 'adtk_' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export default function UserProfile() {
  const { profile, refreshProfile } = useAuth()

  // Profile edit
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password change
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Tokens
  const [tokens, setTokens] = useState<UserToken[]>([])
  const [tokensLoaded, setTokensLoaded] = useState(false)
  const [tokensLoading, setTokensLoading] = useState(false)
  const [showCreateToken, setShowCreateToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenExpiry, setNewTokenExpiry] = useState('')
  const [creatingToken, setCreatingToken] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [tokenCreateError, setTokenCreateError] = useState('')
  const [confirmRevoke, setConfirmRevoke] = useState<UserToken | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadTokens = useCallback(async () => {
    if (!profile) return
    setTokensLoading(true)
    const { data } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setTokens(data as UserToken[])
    setTokensLoaded(true)
    setTokensLoading(false)
  }, [profile])

  // Load tokens on first mount
  React.useEffect(() => {
    if (!tokensLoaded) loadTokens()
  }, [tokensLoaded, loadTokens])

  async function saveProfile() {
    if (!profile) return
    setProfileError('')
    setProfileSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)
    setProfileSaving(false)
    if (error) {
      setProfileError('Erro ao salvar. Tente novamente.')
    } else {
      setProfileSuccess(true)
      await audit.profileUpdated(profile.id, profile.email, { full_name: fullName.trim() })
      await refreshProfile()
      setTimeout(() => setProfileSuccess(false), 3000)
    }
  }

  async function changePassword() {
    setPasswordError('')
    if (!newPass) { setPasswordError('Informe a nova senha.'); return }
    if (newPass.length < 6) { setPasswordError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (newPass !== confirmPass) { setPasswordError('As senhas não coincidem.'); return }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setPasswordSaving(false)

    if (error) {
      setPasswordError('Erro ao alterar senha. Verifique e tente novamente.')
    } else {
      setPasswordSuccess(true)
      if (profile) await audit.passwordChanged(profile.id, profile.email)
      setNewPass('')
      setConfirmPass('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  async function createToken() {
    if (!profile) return
    setTokenCreateError('')
    if (!newTokenName.trim()) {
      setTokenCreateError('Informe um nome para o token.')
      return
    }

    setCreatingToken(true)
    try {
      const rawToken = generateToken()
      const hash = await sha256(rawToken)
      const prefix = rawToken.substring(0, 12) + '...'

      const { data, error } = await supabase
        .from('user_tokens')
        .insert({
          user_id: profile.id,
          name: newTokenName.trim(),
          token_hash: hash,
          token_prefix: prefix,
          expires_at: newTokenExpiry || null,
        })
        .select()
        .single()

      if (error) {
        setTokenCreateError('Erro ao criar token.')
        return
      }

      if (data) {
        await audit.tokenCreated(profile.id, data.id)
        setCreatedToken(rawToken)
        setNewTokenName('')
        setNewTokenExpiry('')
        await loadTokens()
      }
    } finally {
      setCreatingToken(false)
    }
  }

  async function revokeToken() {
    if (!confirmRevoke || !profile) return
    setRevokeLoading(true)
    await supabase
      .from('user_tokens')
      .update({ is_revoked: true })
      .eq('id', confirmRevoke.id)
    await audit.tokenRevoked(profile.id, profile.email, confirmRevoke.id, profile.id)
    setConfirmRevoke(null)
    setRevokeLoading(false)
    await loadTokens()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          <p className="text-sm text-[#6b6b8a]">{profile.email}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={profile.is_active ? 'success' : 'error'}>
            {profile.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      {/* Plan + Usage */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Plano & Uso</h3>
          <PlanBadge plan={profile.plan?.name} variant="full" />
        </div>
        <UsageMeter />
      </Card>

      {/* Profile info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <User size={14} className="text-[#aa3bff]" />
          Informações Pessoais
        </h3>

        <div className="flex flex-col gap-3">
          <Input
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
          />
          <Input
            label="Email"
            value={profile.email}
            disabled
            className="opacity-60"
          />

          {profileError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} />
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check size={12} />
              Perfil atualizado com sucesso!
            </p>
          )}

          <Button onClick={saveProfile} loading={profileSaving} className="w-fit">
            <Check size={13} />
            Salvar Alterações
          </Button>
        </div>
      </Card>

      {/* Change password */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Lock size={14} className="text-[#aa3bff]" />
          Alterar Senha
        </h3>

        {!isSupabaseConfigured ? (
          <p className="text-xs text-[#6b6b8a]">
            Alteração de senha disponível apenas quando Supabase está configurado.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Input
                label="Nova senha"
                type={showNewPass ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPass((v) => !v)}
                className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
              >
                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirmar nova senha"
                type={showCurrentPass ? 'text' : 'password'}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass((v) => !v)}
                className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
              >
                {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={12} />
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check size={12} />
                Senha alterada com sucesso!
              </p>
            )}

            <Button onClick={changePassword} loading={passwordSaving} className="w-fit">
              Alterar Senha
            </Button>
          </div>
        )}
      </Card>

      {/* Tokens */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key size={14} className="text-[#aa3bff]" />
            Meus Tokens de Acesso
          </h3>
          <Button
            variant="secondary"
            onClick={() => { setShowCreateToken(true); setCreatedToken(null); setTokenCreateError('') }}
            className="text-xs py-1.5 px-3"
          >
            <Plus size={12} />
            Novo Token
          </Button>
        </div>

        {tokensLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#aa3bff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#6b6b8a]">
            <Key size={24} className="mb-2 opacity-40" />
            <p className="text-xs">Nenhum token criado ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-medium text-[#c4c4d4]">{t.name}</p>
                    <Badge variant={t.is_revoked ? 'error' : 'success'} className="text-[9px]">
                      {t.is_revoked ? 'Revogado' : 'Ativo'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#6b6b8a] font-mono">{t.token_prefix}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[9px] text-[#6b6b8a]">
                      Criado: {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {t.last_used_at && (
                      <span className="text-[9px] text-[#6b6b8a]">
                        Último uso: {new Date(t.last_used_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {t.expires_at && (
                      <span className="text-[9px] text-[#6b6b8a]">
                        Expira: {new Date(t.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                {!t.is_revoked && (
                  <button
                    onClick={() => setConfirmRevoke(t)}
                    className="p-1.5 rounded-md text-[#6b6b8a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all shrink-0"
                    title="Revogar token"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Token Modal */}
      {showCreateToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass glow-accent w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">
                {createdToken ? 'Token Criado!' : 'Criar Token'}
              </h2>
              <button onClick={() => { setShowCreateToken(false); setCreatedToken(null) }} className="text-[#6b6b8a] hover:text-white">
                <X size={18} />
              </button>
            </div>

            {createdToken ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(234,179,8,0.06)] border border-[rgba(234,179,8,0.2)]">
                  <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-400 leading-relaxed">
                    Copie agora. Este token não será exibido novamente por segurança.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[rgba(170,59,255,0.08)] px-3 py-2.5 rounded-lg text-[#aa3bff] break-all border border-[rgba(170,59,255,0.2)]">
                    {createdToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdToken)}
                    className="p-2 rounded-lg bg-[rgba(170,59,255,0.1)] text-[#aa3bff] hover:bg-[rgba(170,59,255,0.2)] transition-all shrink-0"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <Button onClick={() => { setShowCreateToken(false); setCreatedToken(null) }} className="w-full">
                  Concluir
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <Input
                  label="Nome do token *"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="ex: Integração webhook"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#c4c4d4]">Data de expiração (opcional)</label>
                  <input
                    type="date"
                    value={newTokenExpiry}
                    onChange={(e) => setNewTokenExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                  />
                </div>

                {tokenCreateError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {tokenCreateError}
                  </p>
                )}

                <div className="flex gap-2 mt-1">
                  <Button variant="secondary" onClick={() => setShowCreateToken(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={createToken} loading={creatingToken} className="flex-1">
                    Criar Token
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Revoke Modal */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Revogar token?</h3>
            <p className="text-sm text-[#6b6b8a] mb-1">
              <strong className="text-[#c4c4d4]">{confirmRevoke.name}</strong>
            </p>
            <p className="text-xs text-[#6b6b8a] mb-6">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmRevoke(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={revokeToken}
                loading={revokeLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 shadow-none"
              >
                Revogar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
