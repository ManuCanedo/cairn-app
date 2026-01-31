import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types/habit';

interface HabitsState {
  habits: Habit[];
  addHabit: (name: string, description?: string, icon?: string) => void;
  removeHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  isCompletedToday: (id: string) => boolean;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (name, description, icon) => {
        const newHabit: Habit = {
          id: Date.now().toString(),
          name,
          description,
          icon,
          createdAt: Date.now(),
          completedDates: [],
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      toggleHabitCompletion: (id, date) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;

            const isCompleted = habit.completedDates.includes(date);
            return {
              ...habit,
              completedDates: isCompleted
                ? habit.completedDates.filter((d) => d !== date)
                : [...habit.completedDates, date],
            };
          }),
        }));
      },

      isCompletedToday: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return false;
        return habit.completedDates.includes(getTodayString());
      },
    }),
    {
      name: 'habits-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
