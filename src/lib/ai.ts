import { generateId } from './utils'
import type { Script, Copy, VideoAnalysis, CreativeIdea, Trend } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScriptResult = Omit<Script, 'id' | 'user_id' | 'created_at'>
export type CopyResult = Omit<Copy, 'id' | 'user_id' | 'created_at'>
export type VideoAnalysisResult = Omit<VideoAnalysis, 'id' | 'user_id' | 'created_at'>

// ─── OpenAI Client ───────────────────────────────────────────────────────────

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key não configurada.')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro OpenAI: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function parseJSON<T>(text: string): T {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  const raw = match ? (match[1] ?? match[0]) : text
  return JSON.parse(raw.trim())
}

// ─── Script Generator ────────────────────────────────────────────────────────

export async function generateScript(params: {
  product: string
  audience: string
  platform: string
  template?: string
}): Promise<ScriptResult> {
  const { product, audience, platform, template = 'Problema→Solução' } = params

  const prompt = `Crie um roteiro de vídeo para anúncio com os seguintes dados:
- Produto/Serviço: ${product}
- Público-alvo: ${audience}
- Plataforma: ${platform}
- Template: ${template}

Retorne APENAS um JSON válido com essa estrutura:
{
  "hook": "texto do hook (máximo 2 frases impactantes)",
  "development": "desenvolvimento do roteiro (3-4 parágrafos)",
  "demo": "descrição da cena de demonstração do produto",
  "reinforcement": "reforço de prova social e benefícios",
  "cta": "chamada para ação clara e urgente",
  "scenes": ["Cena 1: descrição", "Cena 2: descrição", "Cena 3: descrição", "Cena 4: descrição", "Cena 5: descrição", "Cena 6: descrição"]
}`

  const system = 'Você é um especialista em criação de anúncios de alta conversão para redes sociais. Crie roteiros diretos, persuasivos e adaptados ao público brasileiro. Retorne apenas JSON válido.'

  const raw = await callOpenAI(prompt, system)
  const result = parseJSON<{
    hook: string; development: string; demo: string
    reinforcement: string; cta: string; scenes: string[]
  }>(raw)

  return {
    product, audience, platform, template,
    hook: result.hook,
    development: result.development,
    demo: result.demo,
    reinforcement: result.reinforcement,
    cta: result.cta,
    scenes: result.scenes,
  }
}

// ─── Copy Generator ──────────────────────────────────────────────────────────

export async function generateCopy(params: {
  product: string
  audience: string
  problem: string
}): Promise<CopyResult> {
  const { product, audience, problem } = params

  const prompt = `Crie copies de alta conversão para anúncio com:
- Produto/Serviço: ${product}
- Público-alvo: ${audience}
- Principal dor/problema: ${problem}

Retorne APENAS um JSON válido:
{
  "mainCopy": "copy principal longa (4-6 parágrafos persuasivos)",
  "variations": ["variação curta 1 (1-2 linhas)", "variação curta 2", "variação curta 3"],
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
  "ctas": ["CTA 1", "CTA 2", "CTA 3"]
}`

  const system = 'Você é um copywriter especialista em marketing direto e anúncios de performance para o mercado brasileiro. Use gatilhos mentais, linguagem persuasiva e foco em conversão. Retorne apenas JSON válido.'

  const raw = await callOpenAI(prompt, system)
  const result = parseJSON<{
    mainCopy: string; variations: string[]
    headlines: string[]; ctas: string[]
  }>(raw)

  return {
    product, audience, problem,
    mainCopy: result.mainCopy,
    variations: result.variations,
    headlines: result.headlines,
    ctas: result.ctas,
  }
}

// ─── Video Analyzer ──────────────────────────────────────────────────────────

export async function analyzeVideo(params: {
  url?: string
  description: string
}): Promise<VideoAnalysisResult> {
  const { description, url } = params

  const prompt = `Analise este anúncio em vídeo e dê uma avaliação detalhada:
${url ? `URL: ${url}` : ''}
Descrição: ${description}

Retorne APENAS um JSON válido:
{
  "hookScore": <número 0-100>,
  "retentionScore": <número 0-100>,
  "clarityScore": <número 0-100>,
  "storytellingScore": <número 0-100>,
  "ctaScore": <número 0-100>,
  "viralScore": <número 0-100>,
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3", "ponto forte 4"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2", "ponto fraco 3"],
  "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3", "sugestão 4"]
}`

  const system = 'Você é um especialista em análise de anúncios de vídeo para redes sociais, com foco em métricas de performance, retenção e conversão. Seja específico e acionável nas sugestões. Retorne apenas JSON válido.'

  const raw = await callOpenAI(prompt, system)
  const result = parseJSON<{
    hookScore: number; retentionScore: number; clarityScore: number
    storytellingScore: number; ctaScore: number; viralScore: number
    strengths: string[]; weaknesses: string[]; suggestions: string[]
  }>(raw)

  const overallScore = Math.floor(
    (result.hookScore + result.retentionScore + result.clarityScore +
     result.storytellingScore + result.ctaScore + result.viralScore) / 6
  )

  return {
    video_url: url,
    description,
    overallScore,
    scoreBreakdown: {
      hook: result.hookScore,
      retention: result.retentionScore,
      clarity: result.clarityScore,
      storytelling: result.storytellingScore,
      cta: result.ctaScore,
      viral: result.viralScore,
    },
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    suggestions: result.suggestions,
  }
}

// ─── Creative Ideas ──────────────────────────────────────────────────────────

export async function generateCreativeIdeas(params: {
  niche: string
  product: string
  audience: string
}): Promise<CreativeIdea[]> {
  const { niche, product, audience } = params

  const prompt = `Gere 6 ideias criativas de anúncios para:
- Nicho: ${niche}
- Produto/Serviço: ${product}
- Público-alvo: ${audience}

Retorne APENAS um JSON válido com um array de 6 ideias:
[
  {
    "concept": "nome do conceito criativo",
    "hook": "hook de abertura do vídeo (1-2 frases)",
    "style": "estilo do criativo (ex: UGC, Tutorial, POV, Storytelling)",
    "description": "descrição detalhada de como executar o criativo (3-4 linhas)"
  }
]`

  const system = 'Você é um diretor criativo especialista em anúncios virais para TikTok, Instagram e YouTube. Crie ideias originais, executáveis e com alto potencial de engajamento para o mercado brasileiro. Retorne apenas JSON válido.'

  const raw = await callOpenAI(prompt, system)
  const ideas = parseJSON<{ concept: string; hook: string; style: string; description: string }[]>(raw)

  return ideas.map((idea) => ({
    ...idea,
    niche, product, audience,
    id: generateId(),
    user_id: '',
    created_at: new Date().toISOString(),
  }))
}

// ─── Trends (mock — dados curados) ───────────────────────────────────────────

export async function generateTrends(): Promise<Trend[]> {
  const trends: Omit<Trend, 'id' | 'created_at'>[] = [
    { format: 'UGC Autêntico', growth_pct: 340, hook_style: 'Storytelling Pessoal', description: 'Vídeos filmados pelo próprio usuário com câmera front-facing, sem edição excessiva. Converte 3x mais que conteúdo produzido profissionalmente.', category: 'formato' },
    { format: 'POV Imersivo', growth_pct: 280, hook_style: 'Roleplay / Situação', description: 'Formato "POV você é [persona]" explodiu em todas as plataformas. Alto engajamento por identificação imediata com a situação apresentada.', category: 'formato' },
    { format: 'Tutorial 60s', growth_pct: 195, hook_style: 'Demonstração Direta', description: 'Tutoriais curtos e diretos com resultado revelado no final. Watch rate acima de 80% nesse formato. Altamente compartilhável.', category: 'formato' },
    { format: 'Antes e Depois', growth_pct: 220, hook_style: 'Transformação Visual', description: 'Transição de "caos para ordem" em menos de 15 segundos. Forte apelo emocional e alto potencial de share orgânico.', category: 'formato' },
    { format: 'React a Haters', growth_pct: 175, hook_style: 'Controvérsia Controlada', description: 'Responder críticas reais enquanto demonstra o produto. Gera engajamento massivo por conta da tensão emocional.', category: 'engajamento' },
    { format: 'Texto na Tela', growth_pct: 160, hook_style: 'Curiosidade Textual', description: 'Hook principal apenas em texto nos primeiros frames. Funciona com ou sem som, alcançando usuários em modo silencioso.', category: 'produção' },
    { format: 'Split Screen', growth_pct: 145, hook_style: 'Comparação Visual', description: 'Duas telas simultâneas mostrando contrastes. Alto valor percebido de produção com esforço mínimo.', category: 'produção' },
    { format: 'Trend de Áudio', growth_pct: 310, hook_style: 'Áudio Viral', description: 'Aproveitar áudios em alta para aparecer no algoritmo. Pode multiplicar alcance orgânico em 5-10x se feito no timing certo.', category: 'distribuição' },
  ]
  return trends.map((t) => ({ ...t, id: generateId(), created_at: new Date().toISOString() }))
}
