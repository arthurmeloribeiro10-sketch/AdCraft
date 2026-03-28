import { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { audit } from '../../lib/audit'
import type { UserToken, UserProfile } from '../../types/auth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

type TabType = 'tokens' | 'api-config'

interface TokenWithUser extends UserToken {
  profile?: Pick<UserProfile, 'email' | 'full_name'>
}

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

export default function TokenManagement() {
  const { profile: actorProfile } = useAuth()

  const [tab, setTab] = useState<TabType>('tokens')
  const [tokens, setTokens] = useState<TokenWithUser[]>([])
  const [users, setUsers] = useState<Pick<UserProfile, 'id' | 'email' | 'full_name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUserId, setFilterUserId] = useState('')

  // Create token
  const [showCreate, setShowCreate] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenUserId, setNewTokenUserId] = useState('')
  const [newTokenExpiry, setNewTokenExpiry] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [createError, setCreateError] = useState('')

  // Revoke
  const [confirmRevoke, setConfirmRevoke] = useState<TokenWithUser | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  // API config
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadTokens = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('user_tokens')
      .select('*, profile:profiles(email, full_name)')
      .order('created_at', { ascending: false })

    if (filterUserId) {
      query = query.eq('user_id', filterUserId)
    }

    try {
      const { data } = await query
      if (data) setTokens(data as TokenWithUser[])
    } catch (err) {
      console.error('loadTokens error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterUserId])

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('email')
    if (data) setUsers(data as Pick<UserProfile, 'id' | 'email' | 'full_name'>[])
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  async function handleCreateToken() {
    setCreateError('')
    if (!newTokenName.trim()) {
      setCreateError('Informe um nome para o token.')
      return
    }
    if (!newTokenUserId) {
      setCreateError('Selecione um usuário.')
      return
    }

    setCreateLoading(true)
    try {
      const rawToken = generateToken()
      const hash = await sha256(rawToken)
      const prefix = rawToken.substring(0, 12) + '...'

      const { data, error } = await supabase
        .from('user_tokens')
        .insert({
          user_id: newTokenUserId,
          name: newTokenName.trim(),
          token_hash: hash,
          token_prefix: prefix,
          expires_at: newTokenExpiry || null,
        })
        .select()
        .single()

      if (error) {
        setCreateError('Erro ao criar token.')
        return
      }

      if (data && actorProfile) {
        await audit.tokenCreated(actorProfile.id, data.id)
      }

      setCreatedToken(rawToken)
      setNewTokenName('')
      setNewTokenUserId('')
      setNewTokenExpiry('')
      await loadTokens()
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleRevoke() {
    if (!confirmRevoke || !actorProfile) return
    setRevokeLoading(true)

    try {
      await supabase
        .from('user_tokens')
        .update({ is_revoked: true })
        .eq('id', confirmRevoke.id)

      await audit.tokenRevoked(
        actorProfile.id,
        actorProfile.email,
        confirmRevoke.id,
        confirmRevoke.user_id
      )

      setConfirmRevoke(null)
      await loadTokens()
    } finally {
      setRevokeLoading(false)
    }
  }

  async function handleSaveApiKey() {
    if (!actorProfile) return
    setApiKeySaving(true)

    // In a real implementation, this would call a secure Edge Function
    // to store the key server-side. Here we just show the pattern.
    await new Promise((r) => setTimeout(r, 800))

    await audit.apiKeyUpdated(actorProfile.id, actorProfile.email)

    setApiKeySaving(false)
    setApiKeySaved(true)
    setApiKey('')
    setTimeout(() => setApiKeySaved(false), 3000)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Key size={20} className="text-[#aa3bff]" />
        <div>
          <h1 className="text-xl font-bold text-white">API & Tokens</h1>
          <p className="text-sm text-[#6b6b8a]">Gerencie tokens de usuários e configurações de API</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.1)] mb-6 w-fit">
        {[
          { key: 'tokens', label: 'Tokens por Usuário' },
          { key: 'api-config', label: 'Configuração de API' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as TabType)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white'
                : 'text-[#6b6b8a] hover:text-[#c4c4d4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tokens Tab */}
      {tab === 'tokens' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="px-3 py-2 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
              >
                <option value="">Todos os usuários</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ?? u.email}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => { setShowCreate(true); setCreatedToken(null); setCreateError('') }}>
              <Plus size={14} />
              Criar Token
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#aa3bff] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#6b6b8a]">
                <Key size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Nenhum token encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(170,59,255,0.08)]">
                      {['Usuário', 'Token', 'Nome', 'Criado em', 'Último uso', 'Expira em', 'Status', 'Ações'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((t) => (
                      <tr key={t.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(170,59,255,0.03)]">
                        <td className="px-4 py-3 text-xs text-[#c4c4d4]">
                          {(t.profile as { email?: string })?.email ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded text-[#aa3bff]">
                            {t.token_prefix}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#c4c4d4]">{t.name}</td>
                        <td className="px-4 py-3 text-xs text-[#6b6b8a]">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b6b8a]">
                          {t.last_used_at
                            ? new Date(t.last_used_at).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6b6b8a]">
                          {t.expires_at
                            ? new Date(t.expires_at).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={t.is_revoked ? 'error' : 'success'}>
                            {t.is_revoked ? 'Revogado' : 'Ativo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {!t.is_revoked && (
                            <button
                              onClick={() => setConfirmRevoke(t)}
                              className="p-1.5 rounded-md text-[#6b6b8a] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all"
                              title="Revogar"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* API Config Tab */}
      {tab === 'api-config' && (
        <div className="max-w-xl">
          <Card>
            <h3 className="text-sm font-bold text-white mb-4">Chave OpenAI</h3>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Input
                  label="Nova chave da OpenAI"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {apiKeySaved && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Check size={12} />
                  Chave atualizada com sucesso!
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(234,179,8,0.06)] border border-[rgba(234,179,8,0.15)]">
                <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#6b6b8a] leading-relaxed">
                  Em produção, a chave deve ser armazenada nas variáveis de ambiente das Edge Functions do Supabase
                  e nunca no frontend. Este formulário simula a interface — a chave real é gerenciada server-side.
                </p>
              </div>

              <Button
                onClick={handleSaveApiKey}
                loading={apiKeySaving}
                disabled={!apiKey}
              >
                <Key size={13} />
                Atualizar Chave
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Token Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass glow-accent w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">
                {createdToken ? 'Token Criado!' : 'Criar Token'}
              </h2>
              <button
                onClick={() => { setShowCreate(false); setCreatedToken(null) }}
                className="text-[#6b6b8a] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {createdToken ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(234,179,8,0.06)] border border-[rgba(234,179,8,0.2)]">
                  <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-400 leading-relaxed">
                    Copie este token agora. Ele não será exibido novamente por segurança.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[rgba(170,59,255,0.08)] px-3 py-2.5 rounded-lg text-[#aa3bff] break-all border border-[rgba(170,59,255,0.2)]">
                    {createdToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdToken)}
                    className="p-2 rounded-lg bg-[rgba(170,59,255,0.1)] text-[#aa3bff] hover:bg-[rgba(170,59,255,0.2)] transition-all shrink-0"
                    title="Copiar"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <Button onClick={() => { setShowCreate(false); setCreatedToken(null) }} className="w-full">
                  Concluir
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#c4c4d4]">Usuário *</label>
                  <select
                    value={newTokenUserId}
                    onChange={(e) => setNewTokenUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm text-[#c4c4d4] bg-[rgba(15,15,26,0.8)] border border-[rgba(170,59,255,0.12)] rounded-lg outline-none focus:border-[rgba(170,59,255,0.5)]"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name ?? u.email} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Nome do token *"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="ex: Token de integração"
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

                {createError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {createError}
                  </p>
                )}

                <div className="flex gap-2 mt-1">
                  <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateToken} loading={createLoading} className="flex-1">
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
            <code className="text-xs text-[#aa3bff]">{confirmRevoke.token_prefix}</code>
            <p className="text-xs text-[#6b6b8a] mt-3 mb-6">
              Esta ação não pode ser desfeita. O token ficará inativo imediatamente.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmRevoke(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleRevoke}
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
