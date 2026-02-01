/**
 * Activity template that users define once and reuse for logging.
 * Examples: "Meditate 🧘", "Exercise 💪", "Read 📚"
 */
export interface ActivityTemplate {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name (e.g., "Meditate") */
  name: string;
  /** Single emoji character (e.g., "🧘") */
  emoji: string;
  /** Google Calendar colorId (1-11) */
  colorId: string;
  /** Timestamp when created */
  createdAt: number;
}

/**
 * Input for creating a new activity template.
 * ID and createdAt are generated automatically.
 */
export type CreateActivityInput = Omit<ActivityTemplate, 'id' | 'createdAt'>;

/**
 * Input for updating an existing activity template.
 */
export type UpdateActivityInput = Partial<Omit<ActivityTemplate, 'id' | 'createdAt'>>;
