import { create } from 'zustand'

const useStore = create((set) => ({
  sidebarCollapsed: false,
  searchQuery: '',
  apiHealthy: null,
  topOpportunity: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setApiHealthy: (apiHealthy) => set({ apiHealthy }),
  setTopOpportunity: (topOpportunity) => set({ topOpportunity }),
}))

export default useStore
