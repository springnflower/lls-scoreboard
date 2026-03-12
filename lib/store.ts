'use client';

import { create } from 'zustand';
import type { BatchSummary, CompareResponse, DashboardFilters, GoalTargetInput, PersistedDashboardResponse, ScoreboardData } from './types';

type ScoreboardState = {
  data: ScoreboardData | null;
  fileName: string;
  batchId: string;
  importedAt: string;
  storagePath?: string | null;
  goals: GoalTargetInput[];
  batches: BatchSummary[];
  compare: CompareResponse | null;
  filters: DashboardFilters;
  hydrate: (payload: PersistedDashboardResponse) => void;
  setBatches: (items: BatchSummary[]) => void;
  setCompare: (payload: CompareResponse | null) => void;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
};

const defaultFilters: DashboardFilters = {
  month: 'all',
  channel: 'all',
  category: 'all',
  search: ''
};

export const useScoreboardStore = create<ScoreboardState>((set) => ({
  data: null,
  fileName: '',
  batchId: '',
  importedAt: '',
  storagePath: '',
  goals: [],
  batches: [],
  compare: null,
  filters: defaultFilters,
  hydrate: (payload) =>
    set({
      fileName: payload.fileName,
      batchId: payload.batchId,
      importedAt: payload.importedAt,
      storagePath: payload.storagePath,
      data: payload.data,
      goals: payload.goals
    }),
  setBatches: (items) => set({ batches: items }),
  setCompare: (payload) => set({ compare: payload }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),
  resetFilters: () => set({ filters: defaultFilters })
}));
