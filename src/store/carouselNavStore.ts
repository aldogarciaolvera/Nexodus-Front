import { create } from 'zustand';

export type MainTabName = 'Dashboard' | 'Ideas' | 'Tasks' | 'Fit' | 'Money';

export const PAGE_TO_TAB: Record<number, MainTabName> = {
  0: 'Dashboard',
  1: 'Ideas',
  2: 'Ideas',
  3: 'Tasks',
  4: 'Fit',
  5: 'Fit',
  6: 'Money',
};

export const PAGE_TITLES: Record<number, string> = {
  0: 'Nexodus',
  1: 'Mis Ideas',
  2: 'Mi Diario',
  3: 'Tareas & Habitos',
  4: 'Gym & Rutinas',
  5: 'Dieta & Macros',
  6: 'Finanzas',
};

interface CarouselNavState {
  currentPage: number;
  lastIdeasPage: number; // 1 (Ideas) or 2 (Diario)
  lastFitPage: number;   // 4 (Gym) or 5 (Dieta)
  activeTab: MainTabName;
  setCurrentPage: (page: number) => void;
  scrollToPageFn: ((page: number, animated?: boolean) => void) | null;
  setScrollToPageFn: (fn: ((page: number, animated?: boolean) => void) | null) => void;
  navigateToTab: (tab: MainTabName, subTab?: string) => void;
  navigateToPage: (page: number, animated?: boolean) => void;
}

export const useCarouselNavStore = create<CarouselNavState>((set, get) => ({
  currentPage: 0,
  lastIdeasPage: 1,
  lastFitPage: 4,
  activeTab: 'Dashboard',
  setCurrentPage: (page: number) => {
    const clamped = Math.max(0, Math.min(6, page));
    const activeTab = PAGE_TO_TAB[clamped] || 'Dashboard';
    set((state) => ({
      currentPage: clamped,
      activeTab,
      lastIdeasPage: (clamped === 1 || clamped === 2) ? clamped : state.lastIdeasPage,
      lastFitPage: (clamped === 4 || clamped === 5) ? clamped : state.lastFitPage,
    }));
  },
  scrollToPageFn: null,
  setScrollToPageFn: (fn) => set({ scrollToPageFn: fn }),
  navigateToPage: (page: number, animated = true) => {
    const clamped = Math.max(0, Math.min(6, page));
    const fn = get().scrollToPageFn;
    if (fn) {
      fn(clamped, animated);
    }
    get().setCurrentPage(clamped);
  },
  navigateToTab: (tab: MainTabName, subTab?: string) => {
    let targetPage = 0;
    const { lastIdeasPage, lastFitPage } = get();

    if (tab === 'Dashboard') {
      targetPage = 0;
    } else if (tab === 'Ideas') {
      targetPage = (subTab === 'diario' || subTab === 'diary') ? 2 : (subTab === 'idea' ? 1 : lastIdeasPage);
    } else if (tab === 'Tasks') {
      targetPage = 3;
    } else if (tab === 'Fit') {
      targetPage = subTab === 'diet' ? 5 : (subTab === 'gym' ? 4 : lastFitPage);
    } else if (tab === 'Money') {
      targetPage = 6;
    }

    get().navigateToPage(targetPage, true);
  },
}));

