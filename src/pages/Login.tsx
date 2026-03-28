import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, KeyRound, User, Mail, Lock, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', description: 'Acesso básico' },
  { value: 'pro',     label: 'Pro',     description: 'Recursos avançados' },
  { value: 'elite',   label: 'Elite',   description: 'Acesso completo' },
]

export default function Login() {
  const { user, isLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showPlanKey, setShowPlanKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPlanName, setRegPlanName] = useState('starter')
  const [regPlanKey, setRegPlanKey] = useState('')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#aa3bff', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signIn(loginEmail, loginPassword)
      if (err) { setError(err); return }
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!regPlanKey.trim()) { setError('Insira a chave do plano para ativar seu acesso.'); return }
    setLoading(true)
    try {
      const { error: err } = await signUp(regEmail, regPassword, regName, regPlanKey.trim(), regPlanName)
      if (err) { setError(err); return }
      setSuccess('Conta criada! Redirecionando...')
      setTimeout(() => navigate('/'), 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#08080f' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#aa3bff' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: '#6366f1' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AdCraft</span>
          </div>
          <p className="text-sm" style={{ color: '#6b6b8a' }}>Plataforma de criação de anúncios com IA</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#08080f' }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={tab === t
                  ? { background: '#aa3bff', color: '#fff' }
                  : { color: '#6b6b8a' }
                }
              >
                {t === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm border" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ade80' }}>
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input
                    type="email" required autoComplete="email"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b8a' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)', color: '#fff' }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input type="email" required autoComplete="email"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b8a' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Plan selector */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Plano</label>
                <div className="relative">
                  <select
                    value={regPlanName} onChange={e => setRegPlanName(e.target.value)}
                    className="w-full pl-4 pr-8 py-2.5 rounded-xl border text-sm outline-none appearance-none transition-all"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  >
                    {PLAN_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label} — {p.description}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#6b6b8a' }} />
                </div>
              </div>

              {/* Plan key */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>
                  Chave do plano
                  <span className="ml-1 text-xs" style={{ color: '#6b6b8a' }}>(fornecida pelo administrador)</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b8a' }} />
                  <input
                    type={showPlanKey ? 'text' : 'password'}
                    required
                    value={regPlanKey} onChange={e => setRegPlanKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all font-mono"
                    style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
                    onFocus={e => (e.target.style.borderColor = '#aa3bff')}
                    onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
                  />
                  <button type="button" onClick={() => setShowPlanKey(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b8a' }}>
                    {showPlanKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs" style={{ color: '#6b6b8a' }}>
                  A chave do plano libera o acesso correspondente. Sem ela, o cadastro não é concluído.
                </p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)', color: '#fff' }}>
                {loading ? 'Criando conta...' : 'Criar conta e ativar plano'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#6b6b8a' }}>
          Não tem uma chave de acesso? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
