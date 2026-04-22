import { create } from 'zustand'
import { fetchUserInfo, login as apiLogin, logout as apiLogout } from '../api/auth'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  refreshUser: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ user: null, loading: false })
      return
    }
    try {
      const data = await fetchUserInfo()
      set({ user: data, loading: false })
    } catch {
      apiLogout()
      set({ user: null, loading: false })
    }
  },

  login: async (username, password) => {
    await apiLogin(username, password)
    await get().refreshUser()
  },

  logout: () => {
    apiLogout()
    set({ user: null })
  },
}))
