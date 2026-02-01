import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { useGoogleAuth } from '../src/services/google-auth';
import { MonthView } from '../src/components/Calendar';
import { getOrCreateCairnCalendar, listEvents } from '../src/services/google-calendar';
import { useTokenWarning } from '../src/hooks/useTokenWarning';
import type { CalendarEvent } from '../src/types/calendar';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { signOut } = useGoogleAuth();
  const { showWarning, minutesRemaining } = useTokenWarning();
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
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const calId = await getOrCreateCairnCalendar();
        setCalendarId(calId);

        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const fetchedEvents = await listEvents(
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
  }, [isAuthenticated, today]);

  const handleMonthChange = useCallback(
    async (year: number, month: number) => {
      if (!isAuthenticated || !calendarId) return;

      setIsLoading(true);
      setError(null);

      try {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = endOfMonth(monthStart);
        const fetchedEvents = await listEvents(
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
    },
    [isAuthenticated, calendarId]
  );

  const handleDayPress = useCallback((_date: string) => {
    // TODO: Task 006 - Activity registration on day press
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cairn',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => router.push('/activities')}
                style={styles.headerButton}
                testID="activities-button"
              >
                <Text style={styles.headerButtonText}>Activities</Text>
              </Pressable>
              <Pressable onPress={signOut} style={styles.headerButton} testID="sign-out-button">
                <Text style={styles.headerButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Session Expiry Warning (web only) */}
      {showWarning && (
        <View style={styles.warningBanner} testID="session-warning">
          <Text style={styles.warningText}>
            {minutesRemaining === 0
              ? 'Session expired. Please sign in again.'
              : `Session expires in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}. Sign in again to continue.`}
          </Text>
          <Pressable onPress={signOut} style={styles.warningButton}>
            <Text style={styles.warningButtonText}>Sign In</Text>
          </Pressable>
        </View>
      )}

      {/* User Info */}
      <View style={styles.userSection}>
        {user?.picture && <Image source={{ uri: user.picture }} style={styles.avatar} />}
        <View>
          <Text style={styles.greeting} testID="greeting">
            Hello, {user?.name?.split(' ')[0] ?? 'there'}!
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarSection}>
        {isLoading && (
          <View style={styles.loadingOverlay} testID="loading-overlay">
            <ActivityIndicator size="small" color="#4F46E5" testID="loading-indicator" />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
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
  warningBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  warningButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
