import { View, Text, Pressable, StyleSheet } from 'react-native';
import { getEventColor } from './colors';

interface DayCellProps {
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  /** Array of Google Calendar color IDs for events on this day. */
  eventColors: readonly string[];
  onPress?: () => void;
}

export function DayCell({ dayNumber, isCurrentMonth, isToday, eventColors, onPress }: DayCellProps) {
  const showPlus = eventColors.length > 3;
  const visibleColors = eventColors.slice(0, 3);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.dayContainer, isToday && styles.todayContainer]}>
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.otherMonthText,
            isToday && styles.todayText,
          ]}
        >
          {dayNumber}
        </Text>
      </View>
      <View style={styles.dotsContainer}>
        {visibleColors.map((colorId, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: getEventColor(colorId) }]}
          />
        ))}
        {showPlus && <Text style={styles.plusText}>+</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '14.28%', // 100% / 7 days
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  todayContainer: {
    backgroundColor: '#4F46E5',
  },
  dayText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  otherMonthText: {
    color: '#D1D5DB',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    height: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  plusText: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '600',
  },
});
