import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SpotterStore, SpotterFormData } from '@/lib/types/spotter';

export const useSpotterStore = create<SpotterStore>()(
  persist(
    (set, get) => ({
      currentUser: 'Unknown Spotter',
      setCurrentUser: (user: string) => set({ currentUser: user }),
      
      drafts: {},
      saveDraft: (id: string, data: Partial<SpotterFormData>) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [id]: data
          }
        }));
      },
      
      getDraft: (id: string) => {
        return get().drafts[id];
      },
      
      clearDraft: (id: string) => {
        set((state) => {
          const { [id]: removed, ...remaining } = state.drafts;
          return { drafts: remaining };
        });
      }
    }),
    {
      name: 'spotter-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        drafts: state.drafts
      })
    }
  )
);
