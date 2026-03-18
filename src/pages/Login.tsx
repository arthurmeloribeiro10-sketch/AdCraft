import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, AlertCircle, User, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

type Mode = 'login' | 'signup'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Email ou senha inválidos. Verifique seus dados.')
    } else {
      navigate('/')
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message.includes('already registered')
        ? 'Este email já está cadastrado. Tente fazer login.'
        : 'Erro ao criar conta. Tente novamente.')
    } else {
      setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.')
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] bg-grid flex items-center justify-center relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(170,59,255,0.12) 0%, transparent 70%)' }}
        animate={{ x: [-80, 80, -80], y: [-60, 60, -60] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ x: -80, y: -60, top: '10%', left: '20%' }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
        animate={{ x: [60, -60, 60], y: [40, -40, 40] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        initial={{ x: 60, y: 40, bottom: '15%', right: '15%' }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)' }}
        animate={{ x: [-40, 40, -40], y: [30, -30, 30] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        initial={{ x: -40, y: 30, top: '40%', right: '30%' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass p-8 glow-accent">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] shadow-[0_0_24px_rgba(170,59,255,0.4)] mb-4">
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient mb-1">Adcraft</h1>
            <p className="text-xs text-[#6b6b8a] text-center">
              Um novo conceito de escalabilidade para criativos.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-[#0f0f1a] p-1 mb-6 gap-1">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#aa3bff] to-[#6366f1] text-white shadow-[0_0_12px_rgba(170,59,255,0.3)]'
                    : 'text-[#6b6b8a] hover:text-[#c4c4d4]'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {/* Success message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 px-3 py-3 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-sm text-green-400 mb-4"
              >
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4"
              >
                <div className="relative">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Mail size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                <div className="relative">
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Lock size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-sm text-red-400">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!isSupabaseConfigured}
                  className="w-full py-3 text-base mt-1"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </motion.form>
            ) : (
              /* Sign Up Form */
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSignUp}
                className="flex flex-col gap-4"
              >
                <div className="relative">
                  <Input
                    label="Nome completo"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                  <User size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                <div className="relative">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Mail size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                <div className="relative">
                  <Input
                    label="Senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <Lock size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                <div className="relative">
                  <Input
                    label="Confirmar senha"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <Lock size={14} className="absolute right-3 top-[34px] text-[#6b6b8a] pointer-events-none" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-sm text-red-400">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!isSupabaseConfigured}
                  className="w-full py-3 text-base mt-1"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>

                <p className="text-center text-[11px] text-[#6b6b8a] leading-relaxed">
                  Ao criar sua conta você concorda com os nossos termos de uso.
                </p>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  )
}
