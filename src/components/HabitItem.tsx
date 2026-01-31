import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Habit } from '../types/habit';
import { useHabitsStore } from '../store/habits';

interface HabitItemProps {
  habit: Habit;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export function HabitItem({ habit }: HabitItemProps) {
  const toggleHabitCompletion = useHabitsStore((s) => s.toggleHabitCompletion);
  const today = getTodayString();
  const isCompletedToday = habit.completedDates.includes(today);

  const handleToggle = () => {
    toggleHabitCompletion(habit.id, today);
  };

  return (
    <Pressable
      style={[styles.container, isCompletedToday && styles.completed]}
      onPress={handleToggle}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{habit.icon || '✨'}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.name, isCompletedToday && styles.nameCompleted]}>
            {habit.name}
          </Text>
          {habit.description && (
            <Text style={styles.description}>{habit.description}</Text>
          )}
        </View>
      </View>
      <View style={[styles.checkbox, isCompletedToday && styles.checkboxCompleted]}>
        {isCompletedToday && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completed: {
    backgroundColor: '#F0FDF4',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  nameCompleted: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
