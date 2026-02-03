import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ProvenanceEvent, EventType } from '@/types';

// --- Types ---

interface ProvenanceState {
  events: ProvenanceEvent[];
}

interface ProvenanceActions {
  logEvent: (type: EventType, data: Record<string, unknown>) => ProvenanceEvent;
  getEventsByType: (type: EventType) => ProvenanceEvent[];
  getEventCount: () => number;
  clearEvents: () => void;
  getEvents: () => ProvenanceEvent[];
}

type ProvenanceStore = ProvenanceState & ProvenanceActions;

// --- Store ---

export const useProvenanceStore = create<ProvenanceStore>()((set, get) => ({
  events: [],

  logEvent: (type: EventType, data: Record<string, unknown>): ProvenanceEvent => {
    const event: ProvenanceEvent = {
      id: nanoid(),
      type,
      timestamp: Date.now(),
      data,
    };

    set((state) => ({
      events: [...state.events, event],
    }));

    return event;
  },

  getEventsByType: (type: EventType): ProvenanceEvent[] => {
    return get().events.filter((event) => event.type === type);
  },

  getEventCount: (): number => {
    return get().events.length;
  },

  clearEvents: () => {
    set({ events: [] });
  },

  getEvents: (): ProvenanceEvent[] => {
    return get().events;
  },
}));
