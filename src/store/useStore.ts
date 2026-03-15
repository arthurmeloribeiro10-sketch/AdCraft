import { create } from 'zustand'
import type { Script, Copy, VideoAnalysis, CreativeIdea } from '../types'

interface StoreState {
  activeSection: string
  setActiveSection: (s: string) => void

  scripts: Script[]
  addScript: (s: Script) => void

  copies: Copy[]
  addCopy: (c: Copy) => void

  analyses: VideoAnalysis[]
  addAnalysis: (a: VideoAnalysis) => void

  ideas: CreativeIdea[]
  addIdea: (i: CreativeIdea) => void

  isLoading: boolean
  setLoading: (b: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  activeSection: 'Dashboard',
  setActiveSection: (s) => set({ activeSection: s }),

  scripts: [],
  addScript: (s) => set((state) => ({ scripts: [s, ...state.scripts] })),

  copies: [],
  addCopy: (c) => set((state) => ({ copies: [c, ...state.copies] })),

  analyses: [],
  addAnalysis: (a) => set((state) => ({ analyses: [a, ...state.analyses] })),

  ideas: [],
  addIdea: (i) => set((state) => ({ ideas: [i, ...state.ideas] })),

  isLoading: false,
  setLoading: (b) => set({ isLoading: b }),
}))
