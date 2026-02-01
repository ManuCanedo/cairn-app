import {
  MonthView,
  DayCell,
  CalendarHeader,
  GOOGLE_CALENDAR_COLORS,
  getEventColor,
} from '../../../components/Calendar';

describe('Calendar index exports', () => {
  it('exports MonthView', () => {
    expect(MonthView).toBeDefined();
    expect(typeof MonthView).toBe('function');
  });

  it('exports DayCell', () => {
    expect(DayCell).toBeDefined();
    expect(typeof DayCell).toBe('function');
  });

  it('exports CalendarHeader', () => {
    expect(CalendarHeader).toBeDefined();
  });

  it('exports GOOGLE_CALENDAR_COLORS', () => {
    expect(GOOGLE_CALENDAR_COLORS).toBeDefined();
    expect(typeof GOOGLE_CALENDAR_COLORS).toBe('object');
  });

  it('exports getEventColor', () => {
    expect(getEventColor).toBeDefined();
    expect(typeof getEventColor).toBe('function');
  });
});
