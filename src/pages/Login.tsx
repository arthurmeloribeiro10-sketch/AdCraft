import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, KeyRound, User, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Tab = 'login' | 'register'

function InputField({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  rightSlot,
  mono = false,
}: {
  icon: React.ElementType
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete?: string
  required?: boolean
  rightSlot?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#6b6b8a' }} />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`w-full pl-10 ${rightSlot ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border text-sm outline-none transition-colors ${mono ? 'font-mono' : ''}`}
        style={{ background: '#08080f', borderColor: '#1a1a2e', color: '#c4c4d4' }}
        onFocus={e => (e.target.style.borderColor = '#aa3bff')}
        onBlur={e => (e.target.style.borderColor = '#1a1a2e')}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  )
}

export default function Login() {
  const { user, isLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [showPwd, setShowPwd] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [regKey, setRegKey] = useState('')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#aa3bff', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error: err } = await signIn(loginEmail, loginPwd)
      if (err) { setError(err); return }
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (regPwd.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!regKey.trim()) { setError('Insira a chave do plano para ativar seu acesso.'); return }
    setSubmitting(true)
    try {
      const { error: err } = await signUp(regEmail, regPwd, regName, regKey.trim())
      if (err) { setError(err); return }
      setSuccess('Conta criada com sucesso! Entrando...')
      setTimeout(() => navigate('/'), 1500)
    } finally {
      setSubmitting(false)
    }
  }

  const eyeButton = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="text-inherit" style={{ color: '#6b6b8a' }}>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

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
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AdCraft</span>
          </div>
          <p className="text-sm" style={{ color: '#6b6b8a' }}>Plataforma de criação de anúncios com IA</p>
        </div>

        <div className="rounded-2xl border p-8" style={{ background: '#0f0f1a', borderColor: '#1a1a2e' }}>
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#08080f' }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} type="button"
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={tab === t ? { background: '#aa3bff', color: '#fff' } : { color: '#6b6b8a' }}>
                {t === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

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

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Email</label>
                <InputField icon={Mail} type="email" value={loginEmail} onChange={setLoginEmail}
                  placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Senha</label>
                <InputField icon={Lock} type={showPwd ? 'text' : 'password'} value={loginPwd}
                  onChange={setLoginPwd} placeholder="••••••••" autoComplete="current-password"
                  rightSlot={eyeButton(showPwd, () => setShowPwd(p => !p))} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)', color: '#fff' }}>
                {submitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Nome completo</label>
                <InputField icon={User} type="text" value={regName} onChange={setRegName} placeholder="Seu nome" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Email</label>
                <InputField icon={Mail} type="email" value={regEmail} onChange={setRegEmail}
                  placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>Senha</label>
                <InputField icon={Lock} type={showPwd ? 'text' : 'password'} value={regPwd}
                  onChange={setRegPwd} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  rightSlot={eyeButton(showPwd, () => setShowPwd(p => !p))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#c4c4d4' }}>
                  Chave de acesso
                  <span className="ml-1 text-xs" style={{ color: '#6b6b8a' }}>— fornecida pelo administrador</span>
                </label>
                <InputField icon={KeyRound} type={showKey ? 'text' : 'password'} value={regKey}
                  onChange={setRegKey} placeholder="••••••••••••••••••••"
                  autoComplete="off" mono
                  rightSlot={eyeButton(showKey, () => setShowKey(p => !p))} />
                <p className="mt-1.5 text-xs" style={{ color: '#6b6b8a' }}>
                  A chave define automaticamente qual plano será ativado na sua conta.
                </p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #aa3bff, #6366f1)', color: '#fff' }}>
                {submitting ? 'Criando conta...' : 'Criar conta e ativar plano'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#6b6b8a' }}>
          Não tem chave de acesso? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
