import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarState {
  calendarId: string | null;
  setCalendarId: (id: string | null) => void;
  clearCalendarId: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      calendarId: null,

      setCalendarId: (id) => set({ calendarId: id }),

      clearCalendarId: () => set({ calendarId: null }),
    }),
    {
      name: 'cairn-calendar',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
