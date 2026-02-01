import { getEventColor, GOOGLE_CALENDAR_COLORS, DEFAULT_EVENT_COLOR } from '../../../components/Calendar/colors';

describe('colors', () => {
  describe('GOOGLE_CALENDAR_COLORS', () => {
    it('contains all 11 Google Calendar colors', () => {
      expect(Object.keys(GOOGLE_CALENDAR_COLORS)).toHaveLength(11);
    });

    it('maps color IDs 1-11 to hex values', () => {
      expect(GOOGLE_CALENDAR_COLORS['1']).toBe('#7986cb');
      expect(GOOGLE_CALENDAR_COLORS['11']).toBe('#d60000');
    });
  });

  describe('getEventColor', () => {
    it('returns correct color for valid colorId "1"', () => {
      expect(getEventColor('1')).toBe('#7986cb');
    });

    it('returns correct color for valid colorId "5"', () => {
      expect(getEventColor('5')).toBe('#f6c026');
    });

    it('returns correct color for valid colorId "11"', () => {
      expect(getEventColor('11')).toBe('#d60000');
    });

    it('returns default color when colorId is undefined', () => {
      expect(getEventColor(undefined)).toBe(DEFAULT_EVENT_COLOR);
    });

    it('returns default color when colorId is empty string', () => {
      expect(getEventColor('')).toBe(DEFAULT_EVENT_COLOR);
    });

    it('returns default color for invalid colorId', () => {
      expect(getEventColor('999')).toBe(DEFAULT_EVENT_COLOR);
    });

    it('returns default color for colorId "0"', () => {
      expect(getEventColor('0')).toBe(DEFAULT_EVENT_COLOR);
    });
  });

  describe('DEFAULT_EVENT_COLOR', () => {
    it('is the app primary color', () => {
      expect(DEFAULT_EVENT_COLOR).toBe('#4F46E5');
    });
  });
});
