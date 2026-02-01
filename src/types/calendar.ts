/** Google Calendar event time specification. */
export interface EventTime {
  /** For all-day events (YYYY-MM-DD format). */
  date?: string;
  /** For timed events (ISO 8601 format). */
  dateTime?: string;
}

/** Entry in the user's calendar list. */
export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

/** A Google Calendar event. */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: EventTime;
  end: EventTime;
  colorId?: string;
  created?: string;
  updated?: string;
}

/** Response from the calendar list API. */
export interface CalendarListResponse {
  items: CalendarListEntry[];
  nextPageToken?: string;
}

/** Response from the events list API. */
export interface EventListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

/** A Google Calendar resource. */
export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
}
