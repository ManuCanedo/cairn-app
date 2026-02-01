import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import type { ActivityTemplate, CreateActivityInput, UpdateActivityInput } from '../types/activity';

interface ActivitiesState {
  templates: ActivityTemplate[];
  addTemplate: (input: CreateActivityInput) => void;
  updateTemplate: (id: string, updates: UpdateActivityInput) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => ActivityTemplate | undefined;
}

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      templates: [],

      addTemplate: (input) => {
        const newTemplate: ActivityTemplate = {
          id: randomUUID(),
          name: input.name,
          emoji: input.emoji,
          colorId: input.colorId,
          createdAt: Date.now(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id);
      },
    }),
    {
      name: 'cairn-activities',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
