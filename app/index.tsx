import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { useGoogleAuth } from '../src/services/google-auth';
import { MonthView } from '../src/components/Calendar';
import { getOrCreateCairnCalendar, listEvents } from '../src/services/google-calendar';
import type { CalendarEvent } from '../src/types/calendar';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function HomeScreen() {
  const { user, accessToken } = useAuthStore();
  const { signOut } = useGoogleAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const formattedDate = useMemo(
    () =>
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [today]
  );

  // Initialize calendar and load events for current month
  useEffect(() => {
    async function init() {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const calId = await getOrCreateCairnCalendar(accessToken);
        setCalendarId(calId);

        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const fetchedEvents = await listEvents(
          accessToken,
          calId,
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        );
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Failed to initialize calendar:', err);
        setError('Failed to load calendar');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [accessToken, today]);

  const handleMonthChange = useCallback(async (year: number, month: number) => {
    if (!accessToken || !calendarId) return;

    setIsLoading(true);
    setError(null);

    try {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      const fetchedEvents = await listEvents(
        accessToken,
        calendarId,
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      );
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, calendarId]);

  const handleDayPress = useCallback((date: string) => {
    console.log('Day pressed:', date);
    // Will be used in Task 006 for activity registration
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cairn',
          headerRight: () => (
            <Pressable onPress={signOut} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Sign Out</Text>
            </Pressable>
          ),
        }}
      />

      {/* User Info */}
      <View style={styles.userSection}>
        {user?.picture && (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        )}
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'there'}!</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarSection}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#4F46E5" />
          </View>
        )}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => handleMonthChange(today.getFullYear(), today.getMonth() + 1)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <MonthView
            events={events}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <Pressable style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  calendarSection: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 24,
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
    marginTop: -2,
  },
});
