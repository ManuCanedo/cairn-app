/**
 * Token Warning Hook
 *
 * Shows warning on web platform when session is expiring soon.
 * On native, this is a no-op since silent refresh handles token renewal.
 */
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';

const WARNING_THRESHOLD_MS = 10 * 60 * 1000; // Show warning 10 minutes before expiry
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

interface TokenWarningState {
  showWarning: boolean;
  minutesRemaining: number | null;
}

/**
 * Hook to show session expiry warning on web.
 *
 * Returns:
 * - showWarning: true if session is expiring soon (web only)
 * - minutesRemaining: minutes until session expires
 */
export function useTokenWarning(): TokenWarningState {
  const { expiresAt, isAuthenticated } = useAuthStore();
  const [state, setState] = useState<TokenWarningState>({
    showWarning: false,
    minutesRemaining: null,
  });

  useEffect(() => {
    const noWarningState = { showWarning: false, minutesRemaining: null };

    // Native platforms use silent refresh, no warning needed
    if (Platform.OS !== 'web' || !isAuthenticated || !expiresAt) {
      setState(noWarningState);
      return;
    }

    const checkExpiry = () => {
      const timeRemaining = expiresAt - Date.now();
      const shouldWarn = timeRemaining <= WARNING_THRESHOLD_MS;

      setState(
        shouldWarn
          ? { showWarning: true, minutesRemaining: Math.max(0, Math.floor(timeRemaining / 60000)) }
          : noWarningState
      );
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [expiresAt, isAuthenticated]);

  return state;
}
