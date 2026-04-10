export interface User {
  id: string
  email: string
  created_at: string
  user_id?: string
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  workspace_id: string
  name: string
  description?: string
  created_at: string
}

export interface Script {
  id: string
  user_id: string
  product: string
  audience: string
  platform: string
  template: string
  hook: string
  development: string
  demo: string
  reinforcement: string
  cta: string
  scenes: string[]
  created_at: string
}

export interface Copy {
  id: string
  user_id: string
  product: string
  audience: string
  problem: string
  mainCopy: string
  variations: string[]
  headlines: string[]
  ctas: string[]
  created_at: string
}

export interface ScoreBreakdown {
  hook: number
  retention: number
  clarity: number
  storytelling: number
  cta: number
  viral: number
}

export interface VideoAnalysis {
  id: string
  user_id: string
  video_url?: string
  description: string
  overallScore: number
  scoreBreakdown: ScoreBreakdown
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  created_at: string
}

export interface CreativeScore {
  id: string
  analysis_id: string
  user_id: string
  score: number
  breakdown: ScoreBreakdown
  created_at: string
}

export interface CreativeIdea {
  id: string
  user_id: string
  niche: string
  product: string
  audience: string
  concept: string
  hook: string
  style: string
  description: string
  created_at: string
}

export interface WinnerAd {
  id: string
  creative_type: string
  niche: string
  format: string
  platform: string
  structure: string
  strategy: string
  why_works: string
  created_at: string
}

export interface LibraryAd {
  id: string
  creative_type: string
  niche: string
  format: string
  platform: string
  structure: string
  strategy: string
  why_works: string
  hook_example: string
  copy_example: string
  target_audience: string
  difficulty: 'Fácil' | 'Médio' | 'Avançado'
  estimated_ctr: string
  budget_range: string
  created_at: string
}

export interface TrendInputsAdcraft {
  produto: string
  publico: string
  dor: string
  promessa: string
}

export interface Trend {
  id: string
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
  inputs_adcraft: TrendInputsAdcraft
  created_at: string
}

export interface TrendSave {
  id: string
  trend_id: string
  trend_nome: string
  type: 'roteiro' | 'copy'
  content: string
  created_at: string
}

export interface HistoryItem {
  id: string
  user_id: string
  type: 'script' | 'copy' | 'analysis' | 'idea'
  title: string
  preview: string
  platform?: string
  tag?: string
  data: Script | Copy | VideoAnalysis | CreativeIdea
  created_at: string
}

export type Platform = 'TikTok' | 'Facebook' | 'Instagram' | 'YouTube'

export type ScriptTemplate =
  | 'Problema→Solução'
  | 'Storytelling'
  | 'Demonstração'
  | 'Prova Social'
  | 'Antes e Depois'
  | 'Review'
  | 'UGC Criativo'
