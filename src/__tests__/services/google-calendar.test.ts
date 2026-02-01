import {
  GoogleCalendarError,
  AuthExpiredError,
  getOrCreateCairnCalendar,
  listEvents,
  createAllDayEvent,
  deleteEvent,
} from '../../services/google-calendar';
import { useAuthStore } from '../../store/auth';

describe('google-calendar service', () => {
  const mockFetch = global.fetch as jest.Mock;
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth store and mock logout
    useAuthStore.setState({
      accessToken: 'test-token',
      refreshToken: null,
      expiresAt: Date.now() + 3600000,
      user: null,
      isLoading: false,
      isAuthenticated: true,
    });
    // Mock the logout function
    jest.spyOn(useAuthStore.getState(), 'logout').mockImplementation(mockLogout);
  });

  describe('GoogleCalendarError', () => {
    it('creates error with message and status code', () => {
      const error = new GoogleCalendarError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('GoogleCalendarError');
    });

    it('creates error with details', () => {
      const details = { reason: 'invalid_request' };
      const error = new GoogleCalendarError('Test error', 400, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthExpiredError', () => {
    it('creates error with default message', () => {
      const error = new AuthExpiredError();
      expect(error.message).toBe('Session expired. Please sign in again.');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthExpiredError');
    });

    it('creates error with custom message', () => {
      const error = new AuthExpiredError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
      expect(error.statusCode).toBe(401);
    });

    it('is instance of GoogleCalendarError', () => {
      const error = new AuthExpiredError();
      expect(error).toBeInstanceOf(GoogleCalendarError);
    });
  });

  describe('getOrCreateCairnCalendar', () => {
    it('returns existing Cairn calendar ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            items: [
              { id: 'cal-123', summary: 'Cairn' },
              { id: 'cal-456', summary: 'Work' },
            ],
          }),
      });

      const calendarId = await getOrCreateCairnCalendar('test-token');

      expect(calendarId).toBe('cal-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('creates new calendar when Cairn does not exist', async () => {
      // First call: list calendars (no Cairn)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            items: [{ id: 'cal-456', summary: 'Work' }],
          }),
      });

      // Second call: create calendar
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: 'new-cairn-cal',
            summary: 'Cairn',
          }),
      });

      const calendarId = await getOrCreateCairnCalendar('test-token');

      expect(calendarId).toBe('new-cairn-cal');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            summary: 'Cairn',
            description: 'Habit tracking calendar created by Cairn app',
          }),
        })
      );
    });

    it('creates calendar when list is empty', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'new-cal', summary: 'Cairn' }),
        });

      const calendarId = await getOrCreateCairnCalendar('test-token');

      expect(calendarId).toBe('new-cal');
    });

    it('throws AuthExpiredError and logs out on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid token' } }),
      });

      await expect(getOrCreateCairnCalendar('expired-token')).rejects.toThrow(
        AuthExpiredError
      );
      expect(mockLogout).toHaveBeenCalled();
    });

    it('throws GoogleCalendarError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: { message: 'Access denied' } }),
      });

      await expect(getOrCreateCairnCalendar('test-token')).rejects.toThrow(
        GoogleCalendarError
      );
    });

    it('wraps network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getOrCreateCairnCalendar('test-token')).rejects.toThrow(
        'Failed to get or create Cairn calendar: Network error'
      );
    });

    it('wraps non-Error thrown values', async () => {
      mockFetch.mockRejectedValueOnce('string error');

      await expect(getOrCreateCairnCalendar('test-token')).rejects.toThrow(
        'Failed to get or create Cairn calendar: Unknown error'
      );
    });
  });

  describe('listEvents', () => {
    it('returns events from API', async () => {
      const mockEvents = [
        { id: 'evt-1', summary: 'Workout', colorId: '1' },
        { id: 'evt-2', summary: 'Meditation', colorId: '5' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: mockEvents }),
      });

      const events = await listEvents(
        'test-token',
        'calendar-id',
        '2026-01-01',
        '2026-01-31'
      );

      expect(events).toEqual(mockEvents);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/calendar-id/events'),
        expect.any(Object)
      );
    });

    it('returns empty array when items is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const events = await listEvents(
        'test-token',
        'calendar-id',
        '2026-01-01',
        '2026-01-31'
      );

      expect(events).toEqual([]);
    });

    it('encodes calendar ID in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await listEvents(
        'test-token',
        'user@example.com',
        '2026-01-01',
        '2026-01-31'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/user%40example.com/events'),
        expect.any(Object)
      );
    });

    it('includes correct query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await listEvents(
        'test-token',
        'calendar-id',
        '2026-01-01',
        '2026-01-31'
      );

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('singleEvents=true');
      expect(calledUrl).toContain('orderBy=startTime');
      expect(calledUrl).toContain('timeMin=');
      expect(calledUrl).toContain('timeMax=');
    });

    it('throws AuthExpiredError and logs out on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      await expect(
        listEvents('expired-token', 'calendar-id', '2026-01-01', '2026-01-31')
      ).rejects.toThrow(AuthExpiredError);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('throws GoogleCalendarError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(
        listEvents('test-token', 'calendar-id', '2026-01-01', '2026-01-31')
      ).rejects.toThrow(GoogleCalendarError);
    });

    it('wraps network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(
        listEvents('test-token', 'calendar-id', '2026-01-01', '2026-01-31')
      ).rejects.toThrow('Failed to list events: Connection failed');
    });
  });

  describe('createAllDayEvent', () => {
    it('creates event and returns it', async () => {
      const mockEvent = {
        id: 'new-evt',
        summary: 'Workout',
        colorId: '1',
        start: { date: '2026-01-15' },
        end: { date: '2026-01-15' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEvent),
      });

      const event = await createAllDayEvent(
        'test-token',
        'calendar-id',
        'Workout',
        '2026-01-15',
        '1'
      );

      expect(event).toEqual(mockEvent);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars/calendar-id/events',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            summary: 'Workout',
            description: 'Logged via Cairn',
            start: { date: '2026-01-15' },
            end: { date: '2026-01-15' },
            colorId: '1',
          }),
        })
      );
    });

    it('encodes calendar ID in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'evt' }),
      });

      await createAllDayEvent(
        'test-token',
        'user@example.com',
        'Test',
        '2026-01-15',
        '1'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/user%40example.com/events'),
        expect.any(Object)
      );
    });

    it('throws AuthExpiredError and logs out on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      await expect(
        createAllDayEvent('expired-token', 'calendar-id', 'Test', '2026-01-15', '1')
      ).rejects.toThrow(AuthExpiredError);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('throws GoogleCalendarError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Invalid date' } }),
      });

      await expect(
        createAllDayEvent('test-token', 'calendar-id', 'Test', 'invalid', '1')
      ).rejects.toThrow(GoogleCalendarError);
    });

    it('wraps network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      await expect(
        createAllDayEvent('test-token', 'calendar-id', 'Test', '2026-01-15', '1')
      ).rejects.toThrow('Failed to create event: Timeout');
    });
  });

  describe('deleteEvent', () => {
    it('deletes event successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await expect(
        deleteEvent('test-token', 'calendar-id', 'event-id')
      ).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars/calendar-id/events/event-id',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('encodes calendar ID and event ID in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteEvent('test-token', 'user@example.com', 'event@id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendars/user%40example.com/events/event%40id'),
        expect.any(Object)
      );
    });

    it('throws AuthExpiredError and logs out on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      await expect(
        deleteEvent('expired-token', 'calendar-id', 'event-id')
      ).rejects.toThrow(AuthExpiredError);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('throws GoogleCalendarError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: { message: 'Event not found' } }),
      });

      await expect(
        deleteEvent('test-token', 'calendar-id', 'nonexistent')
      ).rejects.toThrow(GoogleCalendarError);
    });

    it('wraps network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network unavailable'));

      await expect(
        deleteEvent('test-token', 'calendar-id', 'event-id')
      ).rejects.toThrow('Failed to delete event: Network unavailable');
    });
  });

  describe('error handling edge cases', () => {
    it('handles JSON parse error gracefully on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        listEvents('test-token', 'calendar-id', '2026-01-01', '2026-01-31')
      ).rejects.toThrow(GoogleCalendarError);
    });

    it('preserves GoogleCalendarError when re-thrown', async () => {
      const originalError = new GoogleCalendarError('Original error', 400);
      mockFetch.mockRejectedValueOnce(originalError);

      try {
        await listEvents('test-token', 'calendar-id', '2026-01-01', '2026-01-31');
      } catch (error) {
        expect(error).toBe(originalError);
      }
    });

    it('preserves AuthExpiredError when re-thrown', async () => {
      const originalError = new AuthExpiredError('Custom expired message');
      mockFetch.mockRejectedValueOnce(originalError);

      try {
        await listEvents('test-token', 'calendar-id', '2026-01-01', '2026-01-31');
      } catch (error) {
        expect(error).toBe(originalError);
        expect(error).toBeInstanceOf(AuthExpiredError);
      }
    });
  });
});
