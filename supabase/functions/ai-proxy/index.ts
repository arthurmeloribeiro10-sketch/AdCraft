import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Gemini helper ───────────────────────────────────────────────────────────

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada nos secrets do Supabase.')

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.8 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro Gemini: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function parseJSON<T>(text: string): T {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  const raw = match ? (match[1] ?? match[0]) : text
  return JSON.parse(raw.trim())
}

// ─── Actions ─────────────────────────────────────────────────────────────────

async function generateScript(params: {
  product: string; audience: string; platform: string; template?: string
}) {
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

  return { product, audience, platform, template, ...result }
}

async function generateCopy(params: {
  product: string; audience: string; problem: string
}) {
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
    mainCopy: string; variations: string[]; headlines: string[]; ctas: string[]
  }>(raw)

  return { product, audience, problem, ...result }
}

async function analyzeVideo(params: {
  url?: string; description: string
}) {
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

async function generateCreativeIdeas(params: {
  niche: string; product: string; audience: string
}) {
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

  return ideas.map((idea) => ({ ...idea, niche, product, audience }))
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { action, params } = await req.json()

    let result: unknown

    switch (action) {
      case 'generate-script':
        result = await generateScript(params)
        break
      case 'generate-copy':
        result = await generateCopy(params)
        break
      case 'analyze-video':
        result = await analyzeVideo(params)
        break
      case 'generate-creative-ideas':
        result = await generateCreativeIdeas(params)
        break
      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
