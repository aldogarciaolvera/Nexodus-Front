import { create } from 'zustand';

export type MainTabName = 'Dashboard' | 'Ideas' | 'Tasks' | 'Fit' | 'Money';

export const PAGE_TO_TAB: Record<number, MainTabName> = {
  0: 'Dashboard',
  1: 'Ideas',
  2: 'Ideas',
  3: 'Tasks',
  4: 'Tasks',
  5: 'Fit',
  6: 'Fit',
  7: 'Money',
};

export const PAGE_TITLES: Record<number, string> = {
  0: 'Nexodus',
  1: 'Mis Ideas',
  2: 'Mi Diario',
  3: 'Mis Tareas',
  4: 'Mis Hábitos',
  5: 'Gym & Rutinas',
  6: 'Dieta & Macros',
  7: 'Finanzas',
};

interface CarouselNavState {
  currentPage: number;
  lastIdeasPage: number; // 1 (Ideas) or 2 (Diario)
  lastTasksPage: number; // 3 (Tasks) or 4 (Habits)
  lastFitPage: number;   // 5 (Gym) or 6 (Dieta)
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
  lastTasksPage: 3,
  lastFitPage: 5,
  activeTab: 'Dashboard',
  setCurrentPage: (page: number) => {
    const clamped = Math.max(0, Math.min(7, page));
    const activeTab = PAGE_TO_TAB[clamped] || 'Dashboard';
    set((state) => ({
      currentPage: clamped,
      activeTab,
      lastIdeasPage: (clamped === 1 || clamped === 2) ? clamped : state.lastIdeasPage,
      lastTasksPage: (clamped === 3 || clamped === 4) ? clamped : state.lastTasksPage,
      lastFitPage: (clamped === 5 || clamped === 6) ? clamped : state.lastFitPage,
    }));
  },
  scrollToPageFn: null,
  setScrollToPageFn: (fn) => set({ scrollToPageFn: fn }),
  navigateToPage: (page: number, animated = true) => {
    const clamped = Math.max(0, Math.min(7, page));
    const fn = get().scrollToPageFn;
    if (fn) {
      fn(clamped, animated);
    }
    get().setCurrentPage(clamped);
  },
  navigateToTab: (tab: MainTabName, subTab?: string) => {
    let targetPage = 0;
    const { currentPage, activeTab, lastIdeasPage, lastTasksPage, lastFitPage } = get();

    if (tab === 'Dashboard') {
      targetPage = 0;
    } else if (tab === 'Ideas') {
      targetPage = (subTab === 'diario' || subTab === 'diary') ? 2 : (subTab === 'idea' ? 1 : lastIdeasPage);
    } else if (tab === 'Tasks') {
      targetPage = (subTab === 'habits' || subTab === 'habit') ? 4 : (subTab === 'tasks' ? 3 : lastTasksPage);
    } else if (tab === 'Fit') {
      targetPage = subTab === 'diet' ? 6 : (subTab === 'gym' ? 5 : lastFitPage);
    } else if (tab === 'Money') {
      targetPage = 7;
    }

    if (targetPage === currentPage && activeTab === tab) return;

    get().navigateToPage(targetPage, true);
  },
}));
