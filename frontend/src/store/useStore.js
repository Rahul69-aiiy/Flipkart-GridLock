import { create } from 'zustand'

const useStore = create((set) => ({
  sidebarCollapsed: false,
  searchQuery: '',
  apiHealthy: null,
  topOpportunity: null,
  isAuthenticated: localStorage.getItem('park_sight_auth') === 'true',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setApiHealthy: (apiHealthy) => set({ apiHealthy }),
  setTopOpportunity: (topOpportunity) => set({ topOpportunity }),
  login: () => {
    localStorage.setItem('park_sight_auth', 'true')
    set({ isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('park_sight_auth')
    set({ isAuthenticated: false })
  },
}))

export default useStore
