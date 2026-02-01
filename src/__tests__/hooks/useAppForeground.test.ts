/**
 * Tests for useAppForeground hook
 *
 * Checks and refreshes token when app comes to foreground.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../../store/auth';
import * as tokenRefresh from '../../services/token-refresh';
import { useAppForeground } from '../../hooks/useAppForeground';

// Mock token-refresh service
jest.mock('../../services/token-refresh');

describe('useAppForeground', () => {
  let appStateCallback: ((state: AppStateStatus) => void) | null = null;
  const originalCurrentState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;

    // Set initial state to background so 'active' triggers the callback
    Object.defineProperty(AppState, 'currentState', {
      value: 'background',
      writable: true,
    });

    // Mock AppState.addEventListener to capture the callback
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
      appStateCallback = callback;
      return { remove: jest.fn() };
    });

    useAuthStore.setState({
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    Object.defineProperty(AppState, 'currentState', {
      value: originalCurrentState,
      writable: true,
    });
  });

  it('registers AppState listener on mount', () => {
    renderHook(() => useAppForeground());

    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes AppState listener on unmount', () => {
    const mockRemove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => useAppForeground());
    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it('calls getValidAccessToken when app becomes active', async () => {
    (tokenRefresh.getValidAccessToken as jest.Mock).mockResolvedValue('valid-token');
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useAppForeground());

    // Simulate app coming to foreground
    act(() => {
      appStateCallback?.('active');
    });

    await waitFor(() => {
      expect(tokenRefresh.getValidAccessToken).toHaveBeenCalled();
    });
  });

  it('does not call getValidAccessToken when app goes to background', () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useAppForeground());

    act(() => {
      appStateCallback?.('background');
    });

    expect(tokenRefresh.getValidAccessToken).not.toHaveBeenCalled();
  });

  it('does not call getValidAccessToken when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false });

    renderHook(() => useAppForeground());

    act(() => {
      appStateCallback?.('active');
    });

    expect(tokenRefresh.getValidAccessToken).not.toHaveBeenCalled();
  });

  it('calls logout when token refresh returns null', async () => {
    const mockLogout = jest.fn();
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'old-token',
    });
    useAuthStore.getState().logout = mockLogout;

    (tokenRefresh.getValidAccessToken as jest.Mock).mockResolvedValue(null);

    renderHook(() => useAppForeground());

    act(() => {
      appStateCallback?.('active');
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('does not logout when token refresh succeeds', async () => {
    const mockLogout = jest.fn();
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'old-token',
    });
    useAuthStore.getState().logout = mockLogout;

    (tokenRefresh.getValidAccessToken as jest.Mock).mockResolvedValue('refreshed-token');

    renderHook(() => useAppForeground());

    act(() => {
      appStateCallback?.('active');
    });

    await waitFor(() => {
      expect(tokenRefresh.getValidAccessToken).toHaveBeenCalled();
    });

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
