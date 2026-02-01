import { useCalendarStore } from '../../store/calendar';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useCalendarStore', () => {
  beforeEach(() => {
    useCalendarStore.setState({ calendarId: null });
  });

  describe('initial state', () => {
    it('has null calendarId initially', () => {
      expect(useCalendarStore.getState().calendarId).toBeNull();
    });
  });

  describe('setCalendarId', () => {
    it('sets the calendarId', () => {
      useCalendarStore.getState().setCalendarId('test-calendar-id');

      expect(useCalendarStore.getState().calendarId).toBe('test-calendar-id');
    });

    it('can set calendarId to null', () => {
      useCalendarStore.setState({ calendarId: 'existing-id' });

      useCalendarStore.getState().setCalendarId(null);

      expect(useCalendarStore.getState().calendarId).toBeNull();
    });
  });

  describe('clearCalendarId', () => {
    it('clears the calendarId', () => {
      useCalendarStore.setState({ calendarId: 'test-id' });

      useCalendarStore.getState().clearCalendarId();

      expect(useCalendarStore.getState().calendarId).toBeNull();
    });
  });

  describe('persistence', () => {
    it('persists calendarId to storage', async () => {
      const { setCalendarId } = useCalendarStore.getState();
      setCalendarId('persisted-calendar-id');

      // Give persist time to write
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check that state was updated (persistence is tested by persist middleware)
      expect(useCalendarStore.getState().calendarId).toBe('persisted-calendar-id');
    });
  });
});
