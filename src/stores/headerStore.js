import { create } from 'zustand'

export const useHeaderStore = create((set) => ({
  headerRight: null,
  setHeaderRight: (node) => set({ headerRight: node }),
}))
