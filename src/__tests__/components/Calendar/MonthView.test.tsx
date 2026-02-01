import { render, fireEvent, screen } from '@testing-library/react';
import { MonthView } from '../../../components/Calendar/MonthView';
import type { CalendarEvent } from '../../../types/calendar';

describe('MonthView', () => {
  const mockOnDayPress = jest.fn();
  const mockOnMonthChange = jest.fn();

  const createEvent = (
    id: string,
    summary: string,
    date: string,
    colorId?: string
  ): CalendarEvent => ({
    id,
    summary,
    start: { date },
    end: { date },
    colorId,
  });

  const createTimedEvent = (
    id: string,
    summary: string,
    dateTime: string,
    colorId?: string
  ): CalendarEvent => ({
    id,
    summary,
    start: { dateTime },
    end: { dateTime },
    colorId,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 15)); // January 15, 2026
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the calendar header', () => {
    render(<MonthView events={[]} />);

    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('renders weekday headers', () => {
    render(<MonthView events={[]} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders day cells', () => {
    render(<MonthView events={[]} />);

    // Check for specific days that appear only once
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  describe('navigation', () => {
    it('navigates to previous month when < is pressed', () => {
      render(<MonthView events={[]} onMonthChange={mockOnMonthChange} />);

      fireEvent.click(screen.getByText('<'));

      expect(mockOnMonthChange).toHaveBeenCalledWith(2025, 12);
    });

    it('navigates to next month when > is pressed', () => {
      render(<MonthView events={[]} onMonthChange={mockOnMonthChange} />);

      fireEvent.click(screen.getByText('>'));

      expect(mockOnMonthChange).toHaveBeenCalledWith(2026, 2);
    });

    it('updates display after navigation', () => {
      render(<MonthView events={[]} />);

      fireEvent.click(screen.getByText('>'));

      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('works without onMonthChange callback', () => {
      render(<MonthView events={[]} />);

      expect(() => {
        fireEvent.click(screen.getByText('>'));
        fireEvent.click(screen.getByText('<'));
      }).not.toThrow();
    });
  });

  describe('day press', () => {
    it('calls onDayPress with formatted date', () => {
      render(<MonthView events={[]} onDayPress={mockOnDayPress} />);

      fireEvent.click(screen.getByText('20'));

      expect(mockOnDayPress).toHaveBeenCalledWith('2026-01-20');
    });

    it('calls onDayPress for padding days from previous month', () => {
      render(<MonthView events={[]} onDayPress={mockOnDayPress} />);

      // January 2026 starts on Thursday, so Dec 29-31 are shown
      const day29s = screen.getAllByText('29');
      fireEvent.click(day29s[0]); // First "29" is from December

      expect(mockOnDayPress).toHaveBeenCalledWith('2025-12-29');
    });

    it('works without onDayPress callback', () => {
      render(<MonthView events={[]} />);

      expect(() => fireEvent.click(screen.getByText('20'))).not.toThrow();
    });
  });

  describe('events', () => {
    it('renders with all-day events', () => {
      const events = [
        createEvent('1', 'Workout', '2026-01-15', '1'),
        createEvent('2', 'Meditation', '2026-01-15', '5'),
      ];

      render(<MonthView events={events} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders with timed events', () => {
      const events = [
        createTimedEvent('1', 'Meeting', '2026-01-15T10:00:00', '1'),
      ];

      render(<MonthView events={events} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('handles events without colorId', () => {
      const events = [createEvent('1', 'Test', '2026-01-15')];

      render(<MonthView events={events} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('handles events with missing date information', () => {
      const eventWithNoDate: CalendarEvent = {
        id: '1',
        summary: 'Broken event',
        start: {},
        end: {},
      };

      render(<MonthView events={[eventWithNoDate]} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('groups multiple events on same day showing plus sign', () => {
      const events = [
        createEvent('1', 'Event 1', '2026-01-15', '1'),
        createEvent('2', 'Event 2', '2026-01-15', '2'),
        createEvent('3', 'Event 3', '2026-01-15', '3'),
        createEvent('4', 'Event 4', '2026-01-15', '4'),
      ];

      render(<MonthView events={events} />);

      expect(screen.getByText('+')).toBeInTheDocument();
    });
  });

  describe('today highlighting', () => {
    it('renders today date', () => {
      render(<MonthView events={[]} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
