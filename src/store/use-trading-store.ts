import { create } from 'zustand';
import { Trade, Position, FundingPayment, FeeRecord, FilterState, JournalAnnotation } from '@/types';
import { generateMockTrades, generateMockPositions, generateMockFundingPayments, generateMockFeeRecords } from '@/lib/mock-data';
import { fetchClientData } from '@/lib/deriverse/engine';

async function fetchTradesFromAPI(walletAddress: string): Promise<{
  trades: Trade[];
  feeRecords: FeeRecord[];
  fundingPayments: FundingPayment[];
}> {
  const res = await fetch(`/api/trades?wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  // Convert ISO date strings back to Date objects
  const trades = (data.trades || []).map((t: any) => ({
    ...t,
    entryTime: new Date(t.entryTime),
    exitTime: t.exitTime ? new Date(t.exitTime) : undefined,
  }));
  const feeRecords = (data.feeRecords || []).map((f: any) => ({
    ...f,
    timestamp: new Date(f.timestamp),
  }));
  const fundingPayments = (data.fundingPayments || []).map((f: any) => ({
    ...f,
    timestamp: new Date(f.timestamp),
  }));
  return { trades, feeRecords, fundingPayments };
}

interface TradingStore {
  trades: Trade[];
  positions: Position[];
  fundingPayments: FundingPayment[];
  feeRecords: FeeRecord[];
  filters: FilterState;
  annotations: Record<string, JournalAnnotation>;
  isLoading: boolean;
  isDemoMode: boolean;

  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  loadMockData: () => void;
  loadLiveData: (walletAddress: string) => void;
  setDemoMode: (demo: boolean) => void;
  setAnnotation: (tradeId: string, annotation: Partial<JournalAnnotation>) => void;
  getAnnotation: (tradeId: string) => JournalAnnotation | undefined;
  connectedWallet: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  symbol: null,
  dateRange: null,
  side: null,
  marketType: null,
};

function loadAnnotationsFromStorage(): Record<string, JournalAnnotation> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('deriverse-annotations');
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const key in parsed) {
        if (parsed[key].updatedAt) {
          parsed[key].updatedAt = new Date(parsed[key].updatedAt);
        }
      }
      return parsed;
    }
  } catch {}
  return {};
}

function saveAnnotationsToStorage(annotations: Record<string, JournalAnnotation>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('deriverse-annotations', JSON.stringify(annotations));
  } catch {}
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  trades: [],
  positions: [],
  fundingPayments: [],
  feeRecords: [],
  filters: DEFAULT_FILTERS,
  annotations: {},
  isLoading: true,
  isDemoMode: true,
  connectedWallet: null,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  loadMockData: () => {
    const trades = generateMockTrades(200);
    const positions = generateMockPositions();
    const fundingPayments = generateMockFundingPayments(50);
    const feeRecords = generateMockFeeRecords(trades);
    const annotations = loadAnnotationsFromStorage();

    set({
      trades,
      positions,
      fundingPayments,
      feeRecords,
      annotations,
      isLoading: false,
      isDemoMode: true,
    });
  },

  loadLiveData: async (walletAddress: string) => {
    set({ isLoading: true, connectedWallet: walletAddress });
    try {
      // Fetch positions + tx history in parallel
      const [clientData, txHistory] = await Promise.all([
        fetchClientData(),
        fetchTradesFromAPI(walletAddress),
      ]);

      const annotations = loadAnnotationsFromStorage();
      const hasTrades = txHistory.trades.length > 0;

      if (!hasTrades) {
        console.warn('[Deriverse] No Deriverse trades found for this wallet.');
      }

      set({
        positions: clientData?.positions || [],
        trades: txHistory.trades,
        feeRecords: txHistory.feeRecords,
        fundingPayments: txHistory.fundingPayments,
        annotations,
        isLoading: false,
        isDemoMode: false,
        connectedWallet: walletAddress,
      });
    } catch (err) {
      console.error('[Deriverse] Failed to load live data:', err);
      get().loadMockData();
    }
  },

  setDemoMode: (demo: boolean) => set({ isDemoMode: demo }),

  setAnnotation: (tradeId, partial) => {
    const current = get().annotations[tradeId] || {
      tradeId,
      notes: '',
      tags: [],
      rating: 0,
      screenshotUrl: '',
      updatedAt: new Date(),
    };
    const updated = { ...current, ...partial, updatedAt: new Date() };
    const newAnnotations = { ...get().annotations, [tradeId]: updated };
    saveAnnotationsToStorage(newAnnotations);
    set({ annotations: newAnnotations });
  },

  getAnnotation: (tradeId) => get().annotations[tradeId],
}));
