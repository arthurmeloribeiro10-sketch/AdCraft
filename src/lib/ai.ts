import { delay, generateId } from './utils'
import type {
  Script,
  Copy,
  VideoAnalysis,
  CreativeIdea,
  Trend,
} from '../types'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScriptResult = Omit<Script, 'id' | 'user_id' | 'created_at'>

export type CopyResult = Omit<Copy, 'id' | 'user_id' | 'created_at'>

export type VideoAnalysisResult = Omit<
  VideoAnalysis,
  'id' | 'user_id' | 'created_at'
>

// ─── API Stubs ───────────────────────────────────────────────────────────────

// TODO: Replace with real OpenAI API call
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callOpenAI(_prompt: string, _options?: any): Promise<null> {
  // TODO: Implement OpenAI integration
  // const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: _prompt }], ..._options })
  // })
  // return response.json()
  return null
}

// TODO: Replace with real Gemini API call
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callGemini(_prompt: string, _options?: any): Promise<null> {
  // TODO: Implement Google Gemini integration
  // const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ contents: [{ parts: [{ text: _prompt }] }] })
  // })
  // return response.json()
  return null
}

// ─── Script Generator ────────────────────────────────────────────────────────

export async function generateScript(params: {
  product: string
  audience: string
  platform: string
  template?: string
}): Promise<ScriptResult> {
  // TODO: Replace mock with real AI call via callOpenAI()
  await delay(2000)

  const platform = params.platform || 'TikTok'
  const template = params.template || 'Problema→Solução'
  const product = params.product || 'seu produto'
  const audience = params.audience || 'seu público'

  const hooks: Record<string, string> = {
    'Problema→Solução': `PARE! Se você é ${audience} e ainda não descobriu ${product}, você está perdendo dinheiro todo dia.`,
    Storytelling: `Há 6 meses eu estava exatamente onde você está agora. Sem resultados, sem estratégia, sem direção. Então descobri ${product}.`,
    Demonstração: `Deixa eu te mostrar em 30 segundos o que ${product} fez por mim. Resultados reais, sem edição.`,
    'Prova Social': `Mais de 10.000 pessoas já transformaram seus resultados com ${product}. Veja o que estão dizendo.`,
    'Antes e Depois': `Antes: sem resultados. Depois: números que eu nem acreditava serem possíveis. Isso foi com ${product}.`,
    Review: `Testei ${product} por 30 dias. Vou ser 100% honesto sobre o que aconteceu.`,
    'UGC Criativo': `Minha rotina mudou completamente depois que comecei a usar ${product}. Deixa eu te mostrar como.`,
  }

  const developments: Record<string, string> = {
    'Problema→Solução': `O problema de ${audience} é que eles passam horas tentando resolver X manualmente, gastam dinheiro com soluções que não funcionam, e no final do dia os resultados não aparecem. A frustração é real e eu sei porque já estive lá.`,
    Storytelling: `Eu tentei de tudo. Cursos caros, mentores, ferramentas complicadas. Nada funcionava até que um amigo me indicou ${product}. Na primeira semana já vi resultados. Na segunda semana eu entendi porque todos estavam falando sobre isso.`,
    Demonstração: `[MOSTRAR TELA/PRODUTO] Aqui você vê em tempo real como funciona. Simples, rápido, eficiente. Em 3 cliques você já consegue X. Nenhuma configuração complicada, nenhuma curva de aprendizado.`,
    'Prova Social': `[MOSTRAR DEPOIMENTOS] João aumentou 300% em 2 meses. Maria saiu do zero para faturar 5 dígitos. Carlos reduziu seu tempo de trabalho pela metade. E todos usam ${product} como ferramenta principal.`,
    'Antes e Depois': `Antes eu gastava horas fazendo X manualmente. Os números eram medíocres e eu estava prestes a desistir. Depois de ${product}, o processo virou automático e os resultados explodiram.`,
    Review: `Vou começar pelo negativo: a curva de aprendizado inicial é um pouco mais longa do que eu esperava. Agora o positivo: uma vez que você entende o sistema, os resultados superam qualquer expectativa. Vale cada centavo.`,
    'UGC Criativo': `Olha que diferença faz no meu dia a dia. De manhã eu uso ${product} pra X. À tarde pra Y. Os resultados aparecem de forma consistente e sem esforço extra.`,
  }

  return {
    product: params.product,
    audience: params.audience,
    platform,
    template,
    hook: hooks[template] || hooks['Problema→Solução'],
    development: developments[template] || developments['Problema→Solução'],
    demo: `[CENA DE DEMONSTRAÇÃO]\n\nMostre ${product} em ação. Destaque os 3 principais benefícios de forma visual e rápida. Use close-ups e transições dinâmicas para manter atenção de ${audience}.\n\n• Benefício 1: Resultado imediato e visível\n• Benefício 2: Facilidade de uso\n• Benefício 3: Transformação comprovada`,
    reinforcement: `Não é só teoria. São resultados reais de pessoas reais como você. ${audience} que usam ${product} relatam:\n\n✓ Mais tempo livre\n✓ Mais resultados consistentes\n✓ Menos estresse e trabalho manual\n\nE o melhor: você pode começar hoje mesmo, sem precisar de experiência prévia.`,
    cta: `Clica no link na bio agora. Por tempo limitado, ${product} está com condição especial exclusiva para quem assistiu esse vídeo. Não deixa pra depois — essa oferta vai embora em breve.`,
    scenes: [
      'Cena 1: Hook visual impactante (0-3s) — close no rosto com expressão de surpresa ou descoberta',
      'Cena 2: Problema apresentado (3-8s) — mostra a dor de forma visceral',
      'Cena 3: Transição revelação (8-10s) — corte rápido para a solução',
      'Cena 4: Demonstração do produto (10-20s) — screen recording ou demonstração ao vivo',
      'Cena 5: Prova social rápida (20-25s) — números, depoimentos em texto',
      'Cena 6: CTA urgente (25-30s) — chamada clara com link na bio',
    ],
  }
}

// ─── Copy Generator ──────────────────────────────────────────────────────────

export async function generateCopy(params: {
  product: string
  audience: string
  problem: string
}): Promise<CopyResult> {
  // TODO: Replace mock with real AI call via callOpenAI()
  await delay(1800)

  const { product, audience, problem } = params

  return {
    product,
    audience,
    problem,
    mainCopy: `Você está cansado de ${problem}?\n\nEu entendo. ${audience} enfrenta esse desafio todo dia — horas perdidas, energia desperdiçada e resultados que não aparecem.\n\nMas e se existisse uma forma diferente? Uma que não exigisse tanto esforço, que funcionasse de verdade e que entregasse os resultados que você sempre quis?\n\n${product} foi criado exatamente para isso.\n\nNão é mais um produto que promete mundos e fundos. É uma solução testada por milhares de pessoas que estavam exatamente onde você está agora.\n\nA questão não é se ${product} vai funcionar para você. A questão é: você vai aproveitar essa oportunidade ou vai continuar convivendo com ${problem}?\n\nA escolha é sua. Mas quem escolhe certo, colhe os resultados.`,
    variations: [
      `Chega de ${problem}. ${product} é a virada de chave que ${audience} precisava. Resultados reais, método comprovado, transformação garantida. Descubra agora.`,
      `${audience}: e se você pudesse resolver ${problem} de uma vez por todas? Com ${product}, isso não é promessa — é o que acontece com quem decide agir. Comece hoje.`,
      `O que separa quem supera ${problem} de quem vive com ele não é talento nem sorte. É ter a ferramenta certa. ${product} é essa ferramenta. Simples assim.`,
    ],
    headlines: [
      `Como ${audience} está vencendo ${problem} com ${product}`,
      `Pare de sofrer com ${problem} — existe uma solução melhor`,
      `O método que ${audience} usa para eliminar ${problem} de vez`,
      `${product}: a ferramenta que transforma ${problem} em resultado`,
      `Por que ${audience} inteligente escolhe ${product} para resolver ${problem}`,
    ],
    ctas: [
      `Quero resolver ${problem} agora`,
      `Começar com ${product} hoje`,
      `Sim, quero transformar meus resultados`,
    ],
  }
}

// ─── Video Analyzer ──────────────────────────────────────────────────────────

export async function analyzeVideo(params: {
  url?: string
  description: string
}): Promise<VideoAnalysisResult> {
  // TODO: Replace mock with real AI call via callGemini() or callOpenAI()
  await delay(2500)

  const hookScore = Math.floor(Math.random() * 25) + 60
  const retentionScore = Math.floor(Math.random() * 30) + 55
  const clarityScore = Math.floor(Math.random() * 20) + 65
  const storytellingScore = Math.floor(Math.random() * 25) + 58
  const ctaScore = Math.floor(Math.random() * 30) + 50
  const viralScore = Math.floor(Math.random() * 25) + 55

  const overallScore = Math.floor(
    (hookScore + retentionScore + clarityScore + storytellingScore + ctaScore + viralScore) / 6
  )

  return {
    video_url: params.url,
    description: params.description,
    overallScore,
    scoreBreakdown: {
      hook: hookScore,
      retention: retentionScore,
      clarity: clarityScore,
      storytelling: storytellingScore,
      cta: ctaScore,
      viral: viralScore,
    },
    strengths: [
      'Hook visual forte nos primeiros 3 segundos — captura atenção imediatamente',
      'Transições dinâmicas mantêm o ritmo e evitam que o usuário saia do vídeo',
      'Produto mostrado de forma clara e direta sem ruído visual',
      'Linguagem acessível e próxima do público-alvo identificado',
    ],
    weaknesses: [
      'CTA não está claro o suficiente — espectador pode não saber o próximo passo',
      'Falta de prova social ou depoimento para reforçar credibilidade',
      'Os primeiros 8 segundos poderiam ser mais agressivos no gancho emocional',
      'Texto na tela em alguns momentos é pequeno demais para mobile',
    ],
    suggestions: [
      'Adicione um CTA verbal claro aos 25-28 segundos do vídeo com urgência',
      'Inclua um depoimento de 5 segundos antes do CTA final para aumentar conversão',
      'Reforce o hook inicial com texto na tela em destaque nos primeiros 3 segundos',
      'Teste uma versão com música mais energética — pode aumentar o watch time em 15-20%',
      'Adicione uma transição de "antes e depois" para tornar a transformação mais visual',
    ],
  }
}

// ─── Creative Ideas ──────────────────────────────────────────────────────────

export async function generateCreativeIdeas(params: {
  niche: string
  product: string
  audience: string
}): Promise<CreativeIdea[]> {
  // TODO: Replace mock with real AI call via callOpenAI()
  await delay(2200)

  const { niche, product, audience } = params

  const ideas: Omit<CreativeIdea, 'id' | 'user_id' | 'created_at'>[] = [
    {
      niche,
      product,
      audience,
      concept: 'O Dia que Tudo Mudou',
      hook: `"Eu estava prestes a desistir de tudo quando descobri ${product}..."`,
      style: 'UGC Emocional',
      description: `Narrativa pessoal e autêntica mostrando o ponto de virada. Começa com a dor máxima do ${audience}, transição emocional e chegada à solução. Filmado em ambiente casual (quarto, café) com iluminação natural. Foco no rosto e reação emocional genuína.`,
    },
    {
      niche,
      product,
      audience,
      concept: 'Tutorial Rápido em 60 Segundos',
      hook: `"Faço isso todo dia e levou apenas 60 segundos. Deixa eu te mostrar."`,
      style: 'Tutorial/How-To',
      description: `Screen recording ou demonstração ao vivo do ${product} em uso. Passos numerados na tela. Resultado final revelado no último segundo. Edição rápida com cortes a cada 3-4 segundos. Música lo-fi de fundo.`,
    },
    {
      niche,
      product,
      audience,
      concept: 'React a Comentários Negativos',
      hook: `"Alguém comentou 'isso não funciona' — deixa eu mostrar meus resultados ao vivo."`,
      style: 'Reação/Controvérsia',
      description: `Formato de reação a críticas reais. Cria tensão e curiosidade imediata. Enquanto responde, demonstra ${product} funcionando. Gera alto engajamento por conta da controvérsia. Ideal para ${audience} que já ouviu críticas sobre o nicho.`,
    },
    {
      niche,
      product,
      audience,
      concept: 'POV: Vida Antes e Depois',
      hook: `"POV: você é ${audience} que acabou de descobrir que isso era possível"`,
      style: 'POV / Roleplay',
      description: `Formato POV popular no TikTok. Cria identificação instantânea com ${audience}. Duas cenas: caos antes, calma e resultados depois. Use legendas criativas e música trending. Fácil de replicar em massa.`,
    },
    {
      niche,
      product,
      audience,
      concept: 'Teste ao Vivo / Experimento',
      hook: `"Vou testar ${product} ao vivo agora e te mostrar exatamente o que acontece"`,
      style: 'Live Test / Experimento',
      description: `Simula autenticidade com um "experimento em tempo real". Suspense mantém watch time alto. Revelar resultados surpreendentes ao final. Pode ser feito em formato de screen recording ou vídeo normal. Funciona muito bem para ${niche}.`,
    },
    {
      niche,
      product,
      audience,
      concept: 'Comparação Brutal',
      hook: `"Por que 90% de ${audience} escolhe errado — e como os 10% vencem"`,
      style: 'Comparação / Educativo',
      description: `Comparação lado a lado de soluções antigas vs ${product}. Dados visuais e claros. Tom educativo mas provocativo. Posiciona ${product} como escolha óbvia para quem quer resultado. Ideal para fase de consideração do funil.`,
    },
  ]

  return ideas.map((idea) => ({
    ...idea,
    id: generateId(),
    user_id: '',
    created_at: new Date().toISOString(),
  }))
}

// ─── Trends ──────────────────────────────────────────────────────────────────

export async function generateTrends(): Promise<Trend[]> {
  // TODO: Replace mock with real trends API or AI call
  await delay(1000)

  const trends: Omit<Trend, 'id' | 'created_at'>[] = [
    {
      format: 'UGC Autêntico',
      growth_pct: 340,
      hook_style: 'Storytelling Pessoal',
      description: 'Vídeos filmados pelo próprio usuário com câmera front-facing, sem edição excessiva. Converte 3x mais que conteúdo produzido profissionalmente.',
      category: 'formato',
    },
    {
      format: 'POV Imersivo',
      growth_pct: 280,
      hook_style: 'Roleplay / Situação',
      description: 'Formato "POV você é [persona]" explodiu em todas as plataformas. Alto engajamento por identificação imediata com a situação apresentada.',
      category: 'formato',
    },
    {
      format: 'Tutorial 60s',
      growth_pct: 195,
      hook_style: 'Demonstração Direta',
      description: 'Tutoriais curtos e diretos com resultado revelado no final. Watch rate acima de 80% nesse formato. Altamente compartilhável.',
      category: 'formato',
    },
    {
      format: 'Antes e Depois Rápido',
      growth_pct: 220,
      hook_style: 'Transformação Visual',
      description: 'Transição de "caos para ordem" em menos de 15 segundos. Forte apelo emocional e alto potencial de share orgânico.',
      category: 'formato',
    },
    {
      format: 'React a Haters',
      growth_pct: 175,
      hook_style: 'Controvérsia Controlada',
      description: 'Responder críticas reais enquanto demonstra o produto. Gera engajamento massivo por conta da tensão emocional.',
      category: 'engajamento',
    },
    {
      format: 'Texto na Tela',
      growth_pct: 160,
      hook_style: 'Curiosidade Textual',
      description: 'Hook principal apenas em texto nos primeiros frames. Funciona com ou sem som, alcançando usuários em modo silencioso.',
      category: 'produção',
    },
    {
      format: 'Split Screen',
      growth_pct: 145,
      hook_style: 'Comparação Visual',
      description: 'Duas telas simultâneas mostrando contrastes. Alto valor percebido de produção com esforço mínimo.',
      category: 'produção',
    },
    {
      format: 'Trend de Áudio',
      growth_pct: 310,
      hook_style: 'Áudio Viral',
      description: 'Aproveitar áudios em alta para aparecer no algoritmo. Pode multiplicar alcance orgânico em 5-10x se feito no timing certo.',
      category: 'distribuição',
    },
  ]

  return trends.map((trend) => ({
    ...trend,
    id: generateId(),
    created_at: new Date().toISOString(),
  }))
}
