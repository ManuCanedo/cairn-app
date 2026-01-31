/** Google Calendar color ID to hex color mapping. */
export const GOOGLE_CALENDAR_COLORS = {
  '1': '#7986cb',
  '2': '#33b679',
  '3': '#8e24aa',
  '4': '#e67c73',
  '5': '#f6c026',
  '6': '#f5511d',
  '7': '#039be5',
  '8': '#616161',
  '9': '#3f51b5',
  '10': '#0b8043',
  '11': '#d60000',
} as const satisfies Record<string, string>;

export const DEFAULT_EVENT_COLOR = '#4F46E5';

/** Returns the hex color for a Google Calendar color ID, or the default color. */
export function getEventColor(colorId?: string): string {
  if (!colorId) return DEFAULT_EVENT_COLOR;
  return GOOGLE_CALENDAR_COLORS[colorId as keyof typeof GOOGLE_CALENDAR_COLORS] ?? DEFAULT_EVENT_COLOR;
}
