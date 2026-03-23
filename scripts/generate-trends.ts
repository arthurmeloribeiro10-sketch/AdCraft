#!/usr/bin/env bun
/**
 * AdCraft — Gerador Diário de Tendências
 * ────────────────────────────────────────
 * Usa Claude AI para identificar tendências de marketing digital
 * e armazena no Supabase (ou em public/trends-cache.json como fallback).
 *
 * Uso:
 *   bun scripts/generate-trends.ts
 *
 * Variáveis de ambiente necessárias:
 *   ANTHROPIC_API_KEY         — chave Claude (obrigatória)
 *   VITE_SUPABASE_URL         — URL do projeto Supabase (opcional)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key do Supabase (opcional)
 */

import Anthropic from '@anthropic-ai/sdk'

// ─── Config ──────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY não configurada. Adicione no .env')
  process.exit(1)
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TrendInputs {
  produto: string
  publico: string
  dor: string
  promessa: string
}

interface TrendRaw {
  nome: string
  plataforma: string
  tipo: 'copy' | 'visual' | 'formato'
  descricao: string
  por_que_viraliza: string
  como_usar: string
  copy_exemplo: string
  ideia_criativo: string
  nivel_viralidade: number
  potencial_conversao: number
  inputs_adcraft: TrendInputs
}

interface TrendsResponse {
  data: string
  tendencias: TrendRaw[]
}

// ─── Geração via Claude ───────────────────────────────────────────────────────

async function generateTrends(): Promise<TrendsResponse> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const dateISO = new Date().toISOString().split('T')[0]

  console.log(`🔍  Gerando tendências para ${today} via Claude...`)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: 'Você é um especialista em performance ads e inteligência de tendências para o mercado digital brasileiro. Pense como um head de growth que precisa de insights prontos para implementar hoje. Retorne apenas JSON válido sem markdown.',
    messages: [
      {
        role: 'user',
        content: `Hoje é ${today}. Identifique 8 tendências atuais de conteúdo viral com alto potencial de conversão para anúncios digitais no Brasil.

Analise padrões de: TikTok, Instagram Reels, Facebook Ads, YouTube Shorts, Google Trends e e-commerce brasileiro.

Retorne APENAS um JSON válido sem markdown:
{
  "data": "${dateISO}",
  "tendencias": [
    {
      "nome": "nome criativo e específico (máx 6 palavras)",
      "plataforma": "TikTok | Instagram | Facebook | YouTube | Multi-plataforma",
      "tipo": "copy | visual | formato",
      "descricao": "descrição objetiva em 2-3 linhas, específica e acionável",
      "por_que_viraliza": "mecanismo de viralização: psicologia, algoritmo ou comportamento do usuário",
      "como_usar": "passos práticos para aplicar em anúncios de alta conversão",
      "copy_exemplo": "exemplo real de copy em português (1-3 frases impactantes)",
      "ideia_criativo": "descrição detalhada de como gravar/produzir o criativo",
      "nivel_viralidade": <inteiro 1-10>,
      "potencial_conversao": <inteiro 1-10>,
      "inputs_adcraft": {
        "produto": "tipo de produto ou serviço ideal para esta tendência",
        "publico": "público-alvo com detalhes demográficos e psicográficos",
        "dor": "principal dor ou problema a endereçar na copy",
        "promessa": "promessa central específica e mensurável"
      }
    }
  ]
}

Regras:
- Tendências específicas e distintas, não genéricas
- Mix: pelo menos 2 TikTok, 2 Instagram, 1 Facebook, 1 YouTube
- Mix de tipos: copy, visual e formato
- Foco em conversão, não apenas viralidade orgânica
- Cada tendência deve ser complementar e aplicável imediatamente`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Resposta inesperada da IA')

  const raw = content.text.trim()
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON não encontrado na resposta')

  const parsed = JSON.parse(match[0]) as TrendsResponse
  if (!parsed.tendencias || !Array.isArray(parsed.tendencias)) {
    throw new Error('Estrutura de resposta inválida')
  }

  return parsed
}

// ─── Persistência ─────────────────────────────────────────────────────────────

async function saveTrends(data: TrendsResponse): Promise<void> {
  const rows = data.tendencias.map((t) => ({
    // Novos campos ricos
    nome: t.nome,
    plataforma: t.plataforma,
    tipo: t.tipo,
    descricao: t.descricao,
    por_que_viraliza: t.por_que_viraliza,
    como_usar: t.como_usar,
    copy_exemplo: t.copy_exemplo,
    ideia_criativo: t.ideia_criativo,
    nivel_viralidade: t.nivel_viralidade,
    potencial_conversao: t.potencial_conversao,
    inputs_adcraft: t.inputs_adcraft,
    // Campos legados (compatibilidade com schema original)
    format: t.nome,
    growth_pct: t.nivel_viralidade * 10,
    hook_style: t.tipo,
    description: t.descricao,
    category: t.tipo,
  }))

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    // Fallback: salvar em arquivo local para o frontend ler
    console.log('⚠️   Supabase não configurado — salvando em public/trends-cache.json')
    await Bun.write(
      new URL('../public/trends-cache.json', import.meta.url),
      JSON.stringify({ generated_at: new Date().toISOString(), ...data }, null, 2)
    )
    console.log('✅  Salvo em public/trends-cache.json')
    return
  }

  // Salvar no Supabase usando service role (bypass RLS)
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Remover tendências com mais de 48h
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 48)
  const { error: deleteError } = await supabase
    .from('trends')
    .delete()
    .lt('created_at', cutoff.toISOString())

  if (deleteError) console.warn('⚠️   Erro ao limpar tendências antigas:', deleteError.message)

  // Inserir novas tendências
  const { error: insertError } = await supabase.from('trends').insert(rows)
  if (insertError) throw new Error(`Erro ao inserir no Supabase: ${insertError.message}`)

  console.log(`✅  ${rows.length} tendências salvas no Supabase`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  AdCraft — Radar de Tendências (execução diária)')
  console.log('─'.repeat(50))

  try {
    const data = await generateTrends()

    console.log(`📊  ${data.tendencias.length} tendências geradas:`)
    data.tendencias.forEach((t, i) => {
      console.log(`    ${i + 1}. [${t.plataforma}] ${t.nome} — Conversão: ${t.potencial_conversao}/10`)
    })

    console.log('')
    await saveTrends(data)

    console.log('')
    console.log('🎯  Radar de Tendências atualizado com sucesso!')
    console.log(`📅  Próxima execução: amanhã às 06:00`)
  } catch (err) {
    console.error('❌  Erro durante geração:', err)
    process.exit(1)
  }
}

main()
