import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

type Tab = 'login' | 'register'

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [tab, setTab] = useState<Tab>('login')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from ?? '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')

    if (!loginEmail.trim()) {
      setLoginError('Informe o email.')
      return
    }
    if (!loginPassword) {
      setLoginError('Informe a senha.')
      return
    }

    setLoginLoading(true)
    const { error } = await signIn(loginEmail.trim(), loginPassword)
    setLoginLoading(false)

    if (error) {
      setLoginError(error)
    } else {
      navigate('/')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    setRegSuccess('')

    if (!regName.trim()) {
      setRegError('Informe seu nome.')
      return
    }
    if (!regEmail.trim()) {
      setRegError('Informe o email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegError('Email inválido.')
      return
    }
    if (regPassword.length < 6) {
      setRegError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (regPassword !== regConfirm) {
      setRegError('As senhas não coincidem.')
      return
    }

    setRegLoading(true)
    const { error } = await signUp(regEmail.trim(), regPassword, regName.trim())
    setRegLoading(false)

    if (error) {
      setRegError(error)
    } else {
      setRegSuccess(
        'Conta criada com sucesso! Verifique seu email para confirmar o cadastro.'
      )
      setRegName('')
      setRegEmail('')
      setRegPassword('')
      setRegConfirm('')
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] bg-grid flex items-center justify-center relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(170,59,255,0.12) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
        animate={{ x: [-80, 80, -80], y: [-60, 60, -60] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          bottom: '15%',
          right: '15%',
        }}
        animate={{ x: [60, -60, 60], y: [40, -40, 40] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="glass p-8 glow-accent">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] shadow-[0_0_24px_rgba(170,59,255,0.4)] mb-3">
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">Adcraft</h1>
            <p className="text-xs text-[#6b6b8a] mt-1">
              Plataforma de criação de anúncios
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(170,59,255,0.08)] mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setLoginError('')
                  setRegError('')
                  setRegSuccess('')
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white shadow-sm'
                    : 'text-[#6b6b8a] hover:text-[#c4c4d4]'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-sm text-red-400"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {loginError}
                </motion.div>
              )}

              <Button type="submit" loading={loginLoading} className="w-full py-3 text-sm mt-1">
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </motion.form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="flex flex-col gap-3.5"
            >
              <Input
                label="Nome completo"
                type="text"
                placeholder="Seu nome"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar senha"
                  type={showRegConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  error={
                    regConfirm && regPassword !== regConfirm
                      ? 'As senhas não coincidem'
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirm((v) => !v)}
                  className="absolute right-3 top-[34px] text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
                  tabIndex={-1}
                >
                  {showRegConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {regError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-sm text-red-400"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {regError}
                </motion.div>
              )}

              {regSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-sm text-emerald-400"
                >
                  <CheckCircle size={14} className="shrink-0" />
                  {regSuccess}
                </motion.div>
              )}

              <Button
                type="submit"
                loading={regLoading}
                className="w-full py-3 text-sm mt-1"
              >
                {regLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>

              <p className="text-center text-xs text-[#6b6b8a] mt-1">
                Ao criar uma conta, você concorda com nossos termos de uso.
              </p>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
