import { View, Text, StyleSheet } from 'react-native';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDate,
  format,
} from 'date-fns';
import { useState, useMemo, useCallback } from 'react';
import type { CalendarEvent } from '../../types/calendar';
import { CalendarHeader } from './CalendarHeader';
import { DayCell } from './DayCell';

interface MonthViewProps {
  events: CalendarEvent[];
  onDayPress?: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getEventDate(event: CalendarEvent): string | null {
  // All-day events use date, timed events use dateTime
  if (event.start.date) {
    return event.start.date;
  }
  if (event.start.dateTime) {
    return event.start.dateTime.split('T')[0];
  }
  return null;
}

export function MonthView({ events, onDayPress, onMonthChange }: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const event of events) {
      const date = getEventDate(event);
      if (date) {
        const existing = map.get(date) ?? [];
        existing.push(event.colorId ?? '');
        map.set(date, existing);
      }
    }
    return map;
  }, [events]);

  // Calculate days to display (including padding from prev/next months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    // Week starts on Monday (weekStartsOn: 1)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const handlePrevMonth = useCallback(() => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [currentDate, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [currentDate, onMonthChange]);

  const handleDayPress = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      onDayPress?.(dateStr);
    },
    [onDayPress]
  );

  return (
    <View style={styles.container}>
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const eventColors = eventsByDate.get(dateStr) ?? [];

          return (
            <DayCell
              key={index}
              dayNumber={getDate(date)}
              isCurrentMonth={isSameMonth(date, currentDate)}
              isToday={isSameDay(date, today)}
              eventColors={eventColors}
              onPress={() => handleDayPress(date)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});
