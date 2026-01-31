import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader = memo(function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPrevMonth} style={styles.navButton}>
        <Text style={styles.navText}>{'<'}</Text>
      </Pressable>
      <Text style={styles.title}>{format(currentDate, 'MMMM yyyy')}</Text>
      <Pressable onPress={onNextMonth} style={styles.navButton}>
        <Text style={styles.navText}>{'>'}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 20,
    color: '#4F46E5',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
