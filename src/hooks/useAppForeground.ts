/**
 * App Foreground Hook
 *
 * Checks and refreshes token when app comes to foreground.
 * Ensures the user has a valid session after returning from background.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/auth';
import { getValidAccessToken } from '../services/token-refresh';

/**
 * Hook that checks token validity when app comes to foreground.
 *
 * - On native: Attempts silent refresh if token is expired
 * - On web: Logs out if token is expired (no refresh possible)
 */
export function useAppForeground(): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasBackground = /inactive|background/.test(appState.current);
      appState.current = nextAppState;

      if (!wasBackground || nextAppState !== 'active') return;

      const { isAuthenticated, logout } = useAuthStore.getState();
      if (!isAuthenticated) return;

      const token = await getValidAccessToken();
      if (!token) logout();
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
