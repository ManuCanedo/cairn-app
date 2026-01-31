import type {
  Calendar,
  CalendarEvent,
  CalendarListResponse,
  EventListResponse,
} from '../types/calendar';
import { useAuthStore } from '../store/auth';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';
const CAIRN_CALENDAR_NAME = 'Cairn';

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GoogleCalendarError';
  }
}

export class AuthExpiredError extends GoogleCalendarError {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message, 401);
    this.name = 'AuthExpiredError';
  }
}

async function apiRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new AuthExpiredError();
    }

    throw new GoogleCalendarError(
      `API request failed: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  // Handle 204 No Content (e.g., DELETE requests)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/** Wraps errors in GoogleCalendarError if not already one. */
function wrapError(error: unknown, context: string): never {
  if (error instanceof GoogleCalendarError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new GoogleCalendarError(`${context}: ${message}`, 0);
}

/** Returns the Cairn calendar ID, creating it if necessary. */
export async function getOrCreateCairnCalendar(
  accessToken: string
): Promise<string> {
  try {
    // First, list all calendars to check if Cairn exists
    const calendarList = await apiRequest<CalendarListResponse>(
      accessToken,
      '/users/me/calendarList'
    );

    const existingCalendar = calendarList.items.find(
      (cal) => cal.summary === CAIRN_CALENDAR_NAME
    );

    if (existingCalendar) {
      return existingCalendar.id;
    }

    // Calendar doesn't exist, create it
    const newCalendar = await apiRequest<Calendar>(
      accessToken,
      '/calendars',
      {
        method: 'POST',
        body: JSON.stringify({
          summary: CAIRN_CALENDAR_NAME,
          description: 'Habit tracking calendar created by Cairn app',
        }),
      }
    );

    return newCalendar.id;
  } catch (error) {
    wrapError(error, 'Failed to get or create Cairn calendar');
  }
}

/** Lists events from a calendar within a date range. */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await apiRequest<EventListResponse>(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
    );

    return response.items ?? [];
  } catch (error) {
    wrapError(error, 'Failed to list events');
  }
}

/** Creates an all-day event in a calendar. */
export async function createAllDayEvent(
  accessToken: string,
  calendarId: string,
  summary: string,
  date: string,
  colorId: string
): Promise<CalendarEvent> {
  try {
    const event = await apiRequest<CalendarEvent>(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify({
          summary,
          description: 'Logged via Cairn',
          start: { date },
          end: { date },
          colorId,
        }),
      }
    );

    return event;
  } catch (error) {
    wrapError(error, 'Failed to create event');
  }
}

/** Deletes an event from a calendar. */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    await apiRequest<void>(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
      }
    );
  } catch (error) {
    wrapError(error, 'Failed to delete event');
  }
}
