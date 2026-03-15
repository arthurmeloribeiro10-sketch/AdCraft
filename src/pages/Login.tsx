import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, AlertCircle, FlaskConical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const { signIn, signInDemo } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
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

      {/* Login card */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass p-8 glow-accent">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] shadow-[0_0_24px_rgba(170,59,255,0.4)] mb-4">
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient mb-2">Adcraft</h1>
            <p className="text-sm text-[#6b6b8a] text-center leading-relaxed max-w-xs">
              Um novo conceito de escalabilidade para quem cria anúncios que realmente convertem.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-sm text-red-400"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!isSupabaseConfigured}
              className="w-full py-3 text-base mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Demo mode */}
          {!isSupabaseConfigured && (
            <div className="mt-4">
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[rgba(170,59,255,0.15)]" />
                <span className="text-xs text-[#6b6b8a]">ou</span>
                <div className="flex-1 h-px bg-[rgba(170,59,255,0.15)]" />
              </div>
              <button
                onClick={() => { signInDemo(); navigate('/') }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[rgba(170,59,255,0.25)] text-[#aa3bff] text-sm font-medium hover:bg-[rgba(170,59,255,0.08)] transition-all duration-150"
              >
                <FlaskConical size={15} />
                Explorar no Modo Demo
              </button>
              <p className="mt-3 text-center text-[11px] text-[#6b6b8a] leading-relaxed">
                Todas as funcionalidades disponíveis · Dados de exemplo · Sem autenticação
              </p>
            </div>
          )}

          <p className="mt-5 text-center text-xs text-[#6b6b8a]">
            Não tem conta?{' '}
            <span className="text-[#aa3bff] cursor-pointer hover:underline">
              Fale com o suporte
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
