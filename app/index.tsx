import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { useCalendarStore } from '../src/store/calendar';
import { useGoogleAuth } from '../src/services/google-auth';
import { MonthView } from '../src/components/Calendar';
import ActivityPicker from '../src/components/ActivityPicker';
import {
  getOrCreateCairnCalendar,
  listEvents,
  createAllDayEvent,
} from '../src/services/google-calendar';
import { useTokenWarning } from '../src/hooks/useTokenWarning';
import type { CalendarEvent } from '../src/types/calendar';
import type { ActivityTemplate } from '../src/types/activity';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { signOut } = useGoogleAuth();
  const { showWarning, minutesRemaining } = useTokenWarning();
  const { calendarId, setCalendarId, clearCalendarId } = useCalendarStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

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

  const handleSignOut = useCallback(() => {
    clearCalendarId();
    signOut();
  }, [clearCalendarId, signOut]);

  // Initialize calendar and load events for current month
  useEffect(() => {
    async function init() {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use persisted calendarId if available, otherwise fetch from API
        let calId = calendarId;
        if (!calId) {
          calId = await getOrCreateCairnCalendar();
          setCalendarId(calId);
        }

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
    // TODO: Future enhancement - open activity picker for specific date
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ type, message });
    // Auto-hide after 3 seconds for success, 5 seconds for errors
    toastTimeoutRef.current = setTimeout(() => setToast(null), type === 'success' ? 3000 : 5000);
  }, []);

  const handleActivitySelect = useCallback(
    async (template: ActivityTemplate) => {
      if (!calendarId) {
        showToast('error', 'Calendar not ready. Please wait.');
        return;
      }

      setIsCreatingEvent(true);
      setToast(null);

      try {
        const todayStr = format(today, 'yyyy-MM-dd');
        await createAllDayEvent(
          calendarId,
          `${template.emoji} ${template.name}`,
          todayStr,
          template.colorId
        );

        // Refresh events to show the new one
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const fetchedEvents = await listEvents(
          calendarId,
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        );
        setEvents(fetchedEvents);

        setIsPickerVisible(false);
        showToast('success', `${template.emoji} ${template.name} logged!`);
      } catch (err) {
        console.error('Failed to log activity:', err);
        showToast('error', 'Failed to log activity');
      } finally {
        setIsCreatingEvent(false);
      }
    },
    [calendarId, today, showToast]
  );

  const handleCreateActivity = useCallback(() => {
    setIsPickerVisible(false);
    router.push('/activities/edit');
  }, [router]);

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
              <Pressable
                onPress={handleSignOut}
                style={styles.headerButton}
                testID="sign-out-button"
              >
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
          <Pressable onPress={handleSignOut} style={styles.warningButton}>
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
      <Pressable
        style={styles.fab}
        onPress={() => setIsPickerVisible(true)}
        testID="fab-button"
        accessibilityRole="button"
        accessibilityLabel="Log activity"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Activity Picker Modal */}
      <ActivityPicker
        visible={isPickerVisible}
        onSelect={handleActivitySelect}
        onClose={() => setIsPickerVisible(false)}
        onCreateActivity={handleCreateActivity}
        isLoading={isCreatingEvent}
      />

      {/* Toast Notification */}
      {toast && (
        <View
          style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}
          testID={toast.type === 'error' ? 'error-toast' : 'success-toast'}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
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
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
