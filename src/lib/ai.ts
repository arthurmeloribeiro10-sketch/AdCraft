import { supabase, isSupabaseConfigured } from './supabase'
import { generateId } from './utils'
import { getActiveApiKey } from './apiKey'
import type { Script, Copy, VideoAnalysis, CreativeIdea, Trend } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScriptResult = Omit<Script, 'id' | 'user_id' | 'created_at'>
export type CopyResult = Omit<Copy, 'id' | 'user_id' | 'created_at'>
export type VideoAnalysisResult = Omit<VideoAnalysis, 'id' | 'user_id' | 'created_at'>

// ─── OpenAI direct ────────────────────────────────────────────────────────────

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getActiveApiKey()
  if (!apiKey) throw new Error('Configure sua chave da OpenAI nas configurações (ícone ⚙️ no topo).')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

// ─── Edge Function (production) ───────────────────────────────────────────────

async function callEdgeFunction<T>(action: string, params: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: { action, params },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as T
}

// ─── Router: Edge Function se Supabase configurado, senão direto ─────────────

async function callAI<T>(action: string, params: object, buildPrompt: () => { prompt: string; system: string }): Promise<T> {
  if (isSupabaseConfigured) {
    return callEdgeFunction<T>(action, params)
  }
  const { prompt, system } = buildPrompt()
  const raw = await callOpenAI(prompt, system)
  return parseJSON<T>(raw)
}

// ─── Script Generator ────────────────────────────────────────────────────────

export async function generateScript(params: {
  product: string
  audience: string
  platform: string
  template?: string
}): Promise<ScriptResult> {
  const { product, audience, platform, template = 'Problema→Solução' } = params

  const result = await callAI<{
    hook: string; development: string; demo: string
    reinforcement: string; cta: string; scenes: string[]
  }>('generate-script', params, () => ({
    prompt: `Crie um roteiro de vídeo para anúncio com os seguintes dados:
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
}`,
    system: 'Você é um especialista em criação de anúncios de alta conversão para redes sociais. Crie roteiros diretos, persuasivos e adaptados ao público brasileiro. Retorne apenas JSON válido.',
  }))

  return { product, audience, platform, template, ...result }
}

// ─── Copy Generator ──────────────────────────────────────────────────────────

export async function generateCopy(params: {
  product: string
  audience: string
  problem: string
}): Promise<CopyResult> {
  const { product, audience, problem } = params

  const result = await callAI<{
    mainCopy: string; variations: string[]; headlines: string[]; ctas: string[]
  }>('generate-copy', params, () => ({
    prompt: `Crie copies de alta conversão para anúncio com:
- Produto/Serviço: ${product}
- Público-alvo: ${audience}
- Principal dor/problema: ${problem}

Retorne APENAS um JSON válido:
{
  "mainCopy": "copy principal longa (4-6 parágrafos persuasivos)",
  "variations": ["variação curta 1 (1-2 linhas)", "variação curta 2", "variação curta 3"],
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4", "headline 5"],
  "ctas": ["CTA 1", "CTA 2", "CTA 3"]
}`,
    system: 'Você é um copywriter especialista em marketing direto e anúncios de performance para o mercado brasileiro. Use gatilhos mentais, linguagem persuasiva e foco em conversão. Retorne apenas JSON válido.',
  }))

  return { product, audience, problem, ...result }
}

// ─── Video Analyzer ──────────────────────────────────────────────────────────

export async function analyzeVideo(params: {
  url?: string
  description: string
}): Promise<VideoAnalysisResult> {
  const { description, url } = params

  const result = await callAI<{
    hookScore: number; retentionScore: number; clarityScore: number
    storytellingScore: number; ctaScore: number; viralScore: number
    strengths: string[]; weaknesses: string[]; suggestions: string[]
  }>('analyze-video', params, () => ({
    prompt: `Analise este anúncio em vídeo e dê uma avaliação detalhada:
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
}`,
    system: 'Você é um especialista em análise de anúncios de vídeo para redes sociais, com foco em métricas de performance, retenção e conversão. Seja específico e acionável nas sugestões. Retorne apenas JSON válido.',
  }))

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

  const ideas = await callAI<
    { concept: string; hook: string; style: string; description: string }[]
  >('generate-creative-ideas', params, () => ({
    prompt: `Gere 6 ideias criativas de anúncios para:
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
]`,
    system: 'Você é um diretor criativo especialista em anúncios virais para TikTok, Instagram e YouTube. Crie ideias originais, executáveis e com alto potencial de engajamento para o mercado brasileiro. Retorne apenas JSON válido.',
  }))

  return ideas.map((idea) => ({
    ...idea,
    niche, product, audience,
    id: generateId(),
    user_id: '',
    created_at: new Date().toISOString(),
  }))
}

// ─── Trend Script Generator ──────────────────────────────────────────────────

export async function generateTrendScript(trend: Trend): Promise<string> {
  const apiKey = getActiveApiKey()

  const fallback = `🎬 HOOK (0–3 seg)
${trend.inputs_adcraft.promessa}

😤 PROBLEMA (3–8 seg)
${trend.inputs_adcraft.dor}

💡 SOLUÇÃO (8–20 seg)
Apresente o ${trend.inputs_adcraft.produto} como a solução direta, simples e comprovada para o problema acima.

✅ PROVA / BENEFÍCIO (20–30 seg)
Mostre um resultado real: depoimento, número ou transformação visual. Reforce por que funciona agora.

🚀 CTA (30–35 seg)
"Clica no link agora e começa hoje mesmo. Vagas/estoque limitado."`

  if (!apiKey && !isSupabaseConfigured) return fallback

  try {
    const result = await callAI<{ roteiro: string }>(
      'generate-trend-script',
      { trend },
      () => ({
        prompt: `Crie um roteiro estruturado para anúncio baseado nesta tendência viral:

Tendência: ${trend.nome}
Plataforma: ${trend.plataforma}
Tipo: ${trend.tipo}
Como usar: ${trend.como_usar}
Produto: ${trend.inputs_adcraft.produto}
Público: ${trend.inputs_adcraft.publico}
Dor: ${trend.inputs_adcraft.dor}
Promessa: ${trend.inputs_adcraft.promessa}

Retorne APENAS um JSON válido:
{
  "roteiro": "roteiro completo separado por seções com emojis:\n\n🎬 HOOK (0–3 seg)\n[hook de abertura]\n\n😤 PROBLEMA (3–8 seg)\n[problema que o público sente]\n\n💡 SOLUÇÃO (8–20 seg)\n[como o produto resolve]\n\n✅ PROVA / BENEFÍCIO (20–30 seg)\n[prova social, resultado ou benefício tangível]\n\n🚀 CTA (30–35 seg)\n[chamada para ação clara e urgente]"
}`,
        system: 'Você é um roteirista especialista em anúncios de alta conversão para o mercado brasileiro. Crie roteiros diretos, práticos e persuasivos. Retorne apenas JSON válido.',
      })
    )
    return result.roteiro
  } catch {
    return fallback
  }
}

// ─── Trend Copy Generator ────────────────────────────────────────────────────

export async function generateTrendCopy(trend: Trend): Promise<string> {
  const apiKey = getActiveApiKey()

  const fallback = `📝 VARIAÇÃO 1 — Emocional\n─────────────────────────────\n${trend.copy_exemplo}\n\n📝 VARIAÇÃO 2 — Direta / Oferta\n─────────────────────────────\n${trend.inputs_adcraft.promessa}. Sem enrolação, sem desculpa. O ${trend.inputs_adcraft.produto} que já transformou centenas de pessoas como você. Comece agora — link na bio.`

  if (!apiKey && !isSupabaseConfigured) return fallback

  try {
    const result = await callAI<{ variacao1: string; variacao2: string }>(
      'generate-trend-copy',
      { trend },
      () => ({
        prompt: `Crie 2 variações de copy para anúncio baseadas nesta tendência:

Tendência: ${trend.nome}
Plataforma: ${trend.plataforma}
Dor: ${trend.inputs_adcraft.dor}
Promessa: ${trend.inputs_adcraft.promessa}
Público: ${trend.inputs_adcraft.publico}
Copy de referência: ${trend.copy_exemplo}

Retorne APENAS um JSON válido:
{
  "variacao1": "copy emocional (3–4 parágrafos, foca na dor, identidade e transformação, termina com CTA suave)",
  "variacao2": "copy direta/oferta (2–3 parágrafos, foca no benefício concreto e urgência, CTA forte)"
}`,
        system: 'Você é um copywriter especialista em performance ads para o mercado brasileiro. Escreva copies persuasivas, diretas e com alto potencial de conversão. Retorne apenas JSON válido.',
      })
    )
    return `📝 VARIAÇÃO 1 — Emocional\n─────────────────────────────\n${result.variacao1}\n\n📝 VARIAÇÃO 2 — Direta / Oferta\n─────────────────────────────\n${result.variacao2}`
  } catch {
    return fallback
  }
}

// ─── Trends — dados curados de fallback ──────────────────────────────────────

const MOCK_TRENDS: Omit<Trend, 'id' | 'created_at'>[] = [
  {
    nome: 'UGC "Cara a Câmera" Sem Corte',
    plataforma: 'TikTok',
    tipo: 'formato',
    descricao: 'Vídeo filmado em frente-facing com uma única tomada, sem edição. O criador fala diretamente para a câmera como se contasse para um amigo, transmitindo autenticidade radical.',
    por_que_viraliza: 'O algoritmo do TikTok prioriza watch-through rate. Vídeos sem cortes forçam atenção e aumentam retenção. Autenticidade gera confiança instantânea e quebra o ceticismo do consumidor.',
    como_usar: 'Grave o criador ou usuário real falando sobre o resultado sem roteiro decorado. Erros e pausas são permitidos — aumentam credibilidade. Hook nos primeiros 2 segundos: "Cara, preciso te contar uma coisa..."',
    copy_exemplo: '"Cara, eu estava com o mesmo problema que você... tentei de tudo e nada funcionava. Aí uma amiga me indicou esse produto e em 7 dias já vi resultado. Não tô brincando não."',
    ideia_criativo: 'Pessoa sentada no sofá, luz natural, câmera levemente instável. Começa mostrando o problema (rosto cansado, situação ruim) e termina revelando o resultado real com emoção genuína.',
    nivel_viralidade: 9,
    potencial_conversao: 8,
    inputs_adcraft: {
      produto: 'Qualquer produto com resultado visível e verificável',
      publico: 'Mulheres 25-45 que já tentaram alternativas sem sucesso',
      dor: 'Frustração com soluções que prometem e não entregam',
      promessa: 'Resultado real em X dias, sem complicação',
    },
  },
  {
    nome: 'POV do Resultado Final',
    plataforma: 'Instagram',
    tipo: 'formato',
    descricao: 'Vídeo que abre já no momento do resultado desejado, criando desejo imediato. O espectador se vê no cenário de sucesso antes de saber o que é o produto.',
    por_que_viraliza: 'Ativa o sistema de recompensa do cérebro antes do pitch. A antecipação do prazer é neurologicamente mais poderosa que a promessa futura. Alto save rate no Instagram.',
    como_usar: 'Abrir com cena do resultado (corpo transformado, conta bancária, casa organizada). Texto na tela: "POV: você tomou a decisão certa 30 dias atrás". CTA: "Começa agora — link na bio".',
    copy_exemplo: '"POV: são 6h da manhã, você acabou de se pesar e perdeu 4kg em 3 semanas. Seus amigos vão perguntar o segredo no churrasco de sábado."',
    ideia_criativo: 'Câmera subjetiva (visão do personagem). Sequência de 3 cenas de resultado: ao acordar, no espelho, reação de amigos. Música motivacional suave. Corte para o produto nos últimos 5 segundos.',
    nivel_viralidade: 8,
    potencial_conversao: 9,
    inputs_adcraft: {
      produto: 'Suplemento, curso online, produto de beleza, método financeiro',
      publico: 'Pessoas que desejam transformação de vida, corpo ou carreira',
      dor: 'Insatisfação profunda com a situação atual',
      promessa: 'Resultado concreto em tempo definido (7, 21 ou 30 dias)',
    },
  },
  {
    nome: 'Hook da Curiosidade Frustrada',
    plataforma: 'Multi-plataforma',
    tipo: 'copy',
    descricao: 'Copy que revela 80% da informação e para antes da conclusão, criando tensão cognitiva que força o clique. Funciona em texto, vídeo e carrossel.',
    por_que_viraliza: 'Explora o "gap de curiosidade" (teoria de Loewenstein). O cérebro fica em estado de tensão até completar a informação, gerando compulsão para continuar. Aumenta CTR em até 3x.',
    como_usar: 'Primeiros 3 segundos/linhas: revelar algo surpreendente pela metade. "73% das pessoas que tentaram [X] erraram o MESMO passo — e esse erro está te custando [Y]." CTA natural para descobrir o que é.',
    copy_exemplo: '"Em 2024, 73% das pessoas que tentaram emagrecer erraram o MESMO passo. (Spoiler: não é a dieta). Se você parar de fazer isso hoje, o resultado vem em menos de 2 semanas."',
    ideia_criativo: 'Texto aparece gradualmente em tela preta, palavra por palavra. Estatística chocante em cor de destaque. A revelação parcial fica na tela por 3 segundos antes do CTA aparecer.',
    nivel_viralidade: 9,
    potencial_conversao: 7,
    inputs_adcraft: {
      produto: 'Infoprodutos, cursos, e-books, mentorias',
      publico: 'Pessoas que já tentaram e não conseguiram resultado',
      dor: 'Falta de resultados apesar dos esforços e tentativas',
      promessa: 'Método diferente que ataca a causa raiz do problema',
    },
  },
  {
    nome: 'Prova Social em Cascata',
    plataforma: 'Facebook',
    tipo: 'copy',
    descricao: 'Sequência de 3-5 depoimentos reais encadeados em um único criativo, criando efeito de avalanche de validação. Cada depoimento adiciona um novo ângulo do resultado.',
    por_que_viraliza: 'Facebook Ads prioriza conteúdo com alto engagement. Múltiplos depoimentos geram comentários de identificação. A repetição progressiva de prova social quebra o ceticismo camada por camada.',
    como_usar: 'Montar vídeo com 3 depoimentos de 10-15s cada, com personas diversas (jovem, mãe, profissional). Cada um com resultado diferente do mesmo produto. CTA aparece após o terceiro, no pico emocional.',
    copy_exemplo: '"Sofia perdeu 8kg. Lucas aumentou a renda em 40%. Carla eliminou a ansiedade. Todos começaram com o mesmo passo — e você pode ser o próximo."',
    ideia_criativo: 'Split-screen com 3 pessoas falando em paralelo, depois convergindo para mostrar o produto. Legendas em negrito com o principal resultado de cada pessoa na tela.',
    nivel_viralidade: 7,
    potencial_conversao: 10,
    inputs_adcraft: {
      produto: 'Qualquer produto com base de clientes satisfeitos e resultados mensuráveis',
      publico: 'Céticos que precisam de múltiplas validações antes de comprar',
      dor: 'Medo de comprar algo que não funcione e perder dinheiro',
      promessa: 'Resultado comprovado por pessoas reais com perfil similar ao seu',
    },
  },
  {
    nome: 'Texto na Tela + Trilha Silenciosa',
    plataforma: 'TikTok',
    tipo: 'visual',
    descricao: 'Criativo onde toda a narrativa acontece via texto na tela, sem narração, apenas com música ambiente suave. Funciona 100% sem fone de ouvido.',
    por_que_viraliza: '85% dos vídeos são assistidos sem som. Criativos que funcionam sem áudio têm alcance orgânico significativamente maior. O silêncio também cria suspense e leitura mais atenta.',
    como_usar: 'Imagem ou vídeo simples de fundo desfocado. Texto aparece progressivamente em sequência: problema → agitação → solução → CTA. Fontes bold, cores contrastantes com fundo. Zero dependência do áudio.',
    copy_exemplo: '"Você está desperdiçando R$300 por mês sem saber | Isso acontece porque [problema] | A solução é mais simples do que você imagina | Clica no link e descobre"',
    ideia_criativo: 'Fundo escuro ou blur de cidade à noite. Texto aparece palavra por palavra com efeito máquina de escrever. Cor muda do vermelho (problema) para verde (solução). CTA pulsa suavemente.',
    nivel_viralidade: 7,
    potencial_conversao: 8,
    inputs_adcraft: {
      produto: 'Apps, serviços financeiros, SaaS, cursos digitais',
      publico: 'Usuários mobile que navegam em silêncio (transporte, trabalho)',
      dor: 'Problema oculto que o usuário não sabe que tem',
      promessa: 'Solução simples e imediata para um problema cotidiano',
    },
  },
  {
    nome: 'Antes/Depois com Twist Inesperado',
    plataforma: 'Instagram',
    tipo: 'visual',
    descricao: 'Transformação visual clássica com elemento surpresa: o "antes" é pior do que o esperado, ou o "depois" supera radicalmente a expectativa. O twist gera compartilhamento espontâneo.',
    por_que_viraliza: 'O cérebro é viciado em padrões de transformação. O twist adiciona dopamina extra e a surpresa garante o compartilhamento ("você precisa ver isso"). Alto save + share no Instagram.',
    como_usar: 'Mostrar "antes" exagerado por 2-3 segundos (situação ruim, específica). Transição dramática (zoom, wipe, flash). "Depois" com resultado superior ao prometido + reação emocional genuína de quem viveu.',
    copy_exemplo: '"Janeiro: mal conseguia subir 1 lance de escada. Março: corri 5km e perdi 12kg. Meu médico disse que posso parar o remédio. Esse é o único [produto] que realmente funcionou comigo."',
    ideia_criativo: 'Transição de wipe revelando o depois. Música que começa lenta e melancólica (antes) e acelera para eufórica (depois). Close no rosto: expressão de sofrimento → alegria autêntica.',
    nivel_viralidade: 8,
    potencial_conversao: 9,
    inputs_adcraft: {
      produto: 'Produtos de saúde, beleza, organização, emagrecimento',
      publico: 'Pessoas insatisfeitas com aparência, saúde ou situação financeira',
      dor: 'Insatisfação com situação atual e tentativas fracassadas anteriores',
      promessa: 'Transformação real, visível e verificável em prazo definido',
    },
  },
  {
    nome: 'Tutorial 60s com Revelação Final',
    plataforma: 'YouTube',
    tipo: 'formato',
    descricao: 'Tutorial que entrega valor real em 60 segundos e revela na conclusão que existe uma versão completa. Gera valor primeiro, pede a conversão só no final — quando a confiança já foi construída.',
    por_que_viraliza: 'YouTube Shorts prioriza watch-through rate. Tutorial completo em 60s força o usuário a assistir tudo. Quem termina já está engajado e converte muito melhor no CTA por reciprocidade.',
    como_usar: 'Abrir com promessa específica: "Em 60 segundos vou te ensinar [X exato]". Entregar de verdade 3 dicas reais. Final: "Isso foi o básico — no método completo fazemos isso em 5 minutos por dia e geramos [Y]."',
    copy_exemplo: '"Em 60 segundos: como dobrar suas vendas no WhatsApp sem gastar mais com anúncio. Passo 1: [dica real]. Passo 2: [dica real]. Passo 3: [dica real]. O método completo está no link."',
    ideia_criativo: 'Timer visual no canto contando os 60s. Cuts rápidos entre cada dica. Progresso visual em checklist. Tela final: resultado do método completo + CTA em destaque com urgência.',
    nivel_viralidade: 8,
    potencial_conversao: 8,
    inputs_adcraft: {
      produto: 'Cursos, mentorias, ferramentas digitais, métodos e sistemas',
      publico: 'Empreendedores e profissionais buscando resultados mais rápidos',
      dor: 'Falta de método estruturado e resultados lentos ou inconsistentes',
      promessa: 'Método completo que gera resultado previsível e replicável',
    },
  },
  {
    nome: 'Reação à Experiência Ruim do Concorrente',
    plataforma: 'TikTok',
    tipo: 'copy',
    descricao: 'Formato onde você reage com empatia a uma experiência ruim comum (sem citar concorrentes por nome), posicionando seu produto como a solução inteligente e superior.',
    por_que_viraliza: 'Gera validação emocional instantânea ("eu também passei por isso!"). A estrutura herói vs. situação ruim é instintivamente atraente. Alta identificação = alto compartilhamento com quem viveu a mesma dor.',
    como_usar: 'Tela dividida: lado esquerdo mostra a experiência comum e frustrante (tom frio, cores dessaturadas), lado direito mostra a experiência com seu produto (tom quente, cores vibrantes). Narrar com empatia genuína.',
    copy_exemplo: '"Você pagou caro, esperou semanas, e o produto chegou horrível? Eu sei o quanto irrita. Foi exatamente isso que me fez criar [produto] — porque você merece [resultado] sem estresse e sem surpresas."',
    ideia_criativo: 'Split screen: esquerda em tons frios e dessaturados (expressão de frustração do cliente), direita em tons quentes e vibrantes (satisfação com o produto). Reações genuínas de clientes reais em cada lado.',
    nivel_viralidade: 7,
    potencial_conversao: 8,
    inputs_adcraft: {
      produto: 'E-commerce, produtos com diferenciais claros de qualidade ou entrega',
      publico: 'Consumidores que já foram decepcionados por marcas similares',
      dor: 'Desconfiança e decepção acumulada com experiências de compra ruins',
      promessa: 'Experiência de compra superior com resultado garantido e suporte real',
    },
  },
]

// ─── Trends — geração por IA com fallback para dados curados ─────────────────

export async function generateTrends(): Promise<Trend[]> {
  const apiKey = getActiveApiKey()
  const created_at = new Date().toISOString()
  const fallback = () => MOCK_TRENDS.map((t) => ({ ...t, id: generateId(), created_at }))

  if (!apiKey && !isSupabaseConfigured) return fallback()

  try {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const result = await callAI<{ tendencias: Omit<Trend, 'id' | 'created_at'>[] }>(
      'generate-trends',
      { date: today },
      () => ({
        prompt: `Hoje é ${today}. Você é um sistema de inteligência de tendências para marketing digital especializado em anúncios de alta conversão no Brasil.

Identifique 8 tendências atuais de conteúdo viral com alto potencial de conversão para anúncios digitais.
Analise padrões de: TikTok, Instagram Reels, Facebook Ads, YouTube Shorts e e-commerce brasileiro.

Retorne APENAS um JSON válido sem markdown:
{
  "tendencias": [
    {
      "nome": "nome criativo e específico da tendência (máx 6 palavras)",
      "plataforma": "TikTok | Instagram | Facebook | YouTube | Multi-plataforma",
      "tipo": "copy | visual | formato",
      "descricao": "descrição clara e objetiva (2-3 linhas, específica e acionável)",
      "por_que_viraliza": "explicação do mecanismo de viralização (psicologia, algoritmo, comportamento do usuário)",
      "como_usar": "passos práticos para aplicar em anúncios de alta conversão",
      "copy_exemplo": "exemplo real de copy pronto para usar (1-3 frases impactantes, em português)",
      "ideia_criativo": "descrição detalhada de como gravar/produzir o criativo",
      "nivel_viralidade": <número inteiro de 1 a 10>,
      "potencial_conversao": <número inteiro de 1 a 10>,
      "inputs_adcraft": {
        "produto": "tipo de produto ou serviço ideal para esta tendência",
        "publico": "público-alvo mais receptivo com detalhes demográficos",
        "dor": "principal dor ou problema a ser abordado na copy",
        "promessa": "promessa central do anúncio (específica e mensurável)"
      }
    }
  ]
}

Regras obrigatórias:
- Tendências específicas e acionáveis, não genéricas
- Mix: pelo menos 2 TikTok, 2 Instagram, 1 Facebook, 1 YouTube
- Mix de tipos: copy, visual e formato
- Foco em conversão, não apenas viralidade orgânica
- Mercado e linguagem brasileira
- Cada tendência deve ser distinta e complementar às outras`,
        system: 'Você é um especialista em performance ads e inteligência de tendências para o mercado digital brasileiro. Pense como um head de growth que precisa de insights prontos para implementar amanhã. Retorne apenas JSON válido sem markdown.',
      })
    )

    return result.tendencias.map((t) => ({ ...t, id: generateId(), created_at }))
  } catch {
    return fallback()
  }
}
