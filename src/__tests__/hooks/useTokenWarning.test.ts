/**
 * Tests for useTokenWarning hook
 *
 * Shows warning banner on web when session is expiring soon.
 * No-op on native (native uses silent refresh).
 */
import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { useTokenWarning } from '../../hooks/useTokenWarning';

describe('useTokenWarning', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAuthStore.setState({
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('on web platform', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('returns showWarning: false when not authenticated', () => {
      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.showWarning).toBe(false);
      expect(result.current.minutesRemaining).toBeNull();
    });

    it('returns showWarning: false when token has plenty of time', () => {
      useAuthStore.setState({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.showWarning).toBe(false);
    });

    it('returns showWarning: true when token expires within warning threshold', () => {
      useAuthStore.setState({
        accessToken: 'expiring-token',
        expiresAt: Date.now() + 8 * 60 * 1000, // 8 minutes
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.showWarning).toBe(true);
      expect(result.current.minutesRemaining).toBe(8);
    });

    it('calculates minutesRemaining correctly', () => {
      useAuthStore.setState({
        accessToken: 'expiring-token',
        expiresAt: Date.now() + 3 * 60 * 1000 + 30000, // 3.5 minutes
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.minutesRemaining).toBe(3); // Floors to 3
    });

    it('updates warning state as time passes', () => {
      useAuthStore.setState({
        accessToken: 'expiring-token',
        expiresAt: Date.now() + 12 * 60 * 1000, // 12 minutes
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());
      expect(result.current.showWarning).toBe(false);

      // Advance time by 3 minutes
      act(() => {
        jest.advanceTimersByTime(3 * 60 * 1000);
      });

      expect(result.current.showWarning).toBe(true);
      expect(result.current.minutesRemaining).toBe(9);
    });

    it('returns showWarning: true when token is already expired', () => {
      useAuthStore.setState({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // Expired
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.showWarning).toBe(true);
      expect(result.current.minutesRemaining).toBe(0);
    });
  });

  describe('on native platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('always returns showWarning: false (native uses silent refresh)', () => {
      useAuthStore.setState({
        accessToken: 'expiring-token',
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useTokenWarning());

      expect(result.current.showWarning).toBe(false);
      expect(result.current.minutesRemaining).toBeNull();
    });
  });
});
