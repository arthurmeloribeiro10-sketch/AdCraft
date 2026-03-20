import { useState, useEffect } from 'react'
import { X, Key, ExternalLink, Check, Eye, EyeOff } from 'lucide-react'
import { getStoredApiKey, setStoredApiKey, hasActiveApiKey } from '../../lib/apiKey'

interface ApiKeyModalProps {
  open: boolean
  onClose: () => void
}

export default function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setKey(getStoredApiKey())
      setSaved(false)
    }
  }, [open])

  function handleSave() {
    setStoredApiKey(key)
    setSaved(true)
    setTimeout(() => {
      onClose()
      setSaved(false)
    }, 800)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,8,15,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl border border-[rgba(170,59,255,0.2)] p-6 shadow-2xl"
        style={{ background: '#0f0f1a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#aa3bff] to-[#6366f1] flex items-center justify-center">
              <Key size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#c4c4d4]">Configurar IA</h2>
              <p className="text-xs text-[#6b6b8a]">Chave da OpenAI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b6b8a] hover:text-[#c4c4d4] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Current status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-5 text-xs font-medium ${
          hasActiveApiKey()
            ? 'bg-[rgba(52,211,153,0.1)] text-emerald-400 border border-[rgba(52,211,153,0.2)]'
            : 'bg-[rgba(239,68,68,0.1)] text-red-400 border border-[rgba(239,68,68,0.2)]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hasActiveApiKey() ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {hasActiveApiKey() ? 'Chave configurada e pronta' : 'Nenhuma chave configurada'}
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#6b6b8a] mb-2">
            Sua chave da OpenAI
          </label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sk-proj-..."
              autoFocus
              className="w-full px-4 py-3 pr-11 rounded-xl text-sm font-mono text-[#c4c4d4] placeholder-[#6b6b8a] border border-[rgba(170,59,255,0.2)] focus:border-[#aa3bff] focus:outline-none transition-colors"
              style={{ background: '#14142a' }}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#c4c4d4] transition-colors"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-[#6b6b8a] mb-6 leading-relaxed">
          A chave é salva <strong className="text-[#c4c4d4]">somente no seu navegador</strong> (localStorage) e nunca é enviada para nenhum servidor.{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#aa3bff] hover:underline inline-flex items-center gap-1"
          >
            Obter chave <ExternalLink size={11} />
          </a>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#6b6b8a] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:text-[#c4c4d4] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #aa3bff, #6366f1)',
            }}
          >
            {saved ? (
              <>
                <Check size={14} />
                Salvo!
              </>
            ) : (
              'Salvar chave'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
