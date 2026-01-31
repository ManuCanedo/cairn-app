export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: number;
  completedDates: string[]; // ISO date strings (YYYY-MM-DD)
}

export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date string (YYYY-MM-DD)
}
