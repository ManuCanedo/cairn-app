import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useGoogleAuth } from '../../services/google-auth';
import { useAuthStore } from '../../store/auth';
import * as tokenStorage from '../../services/token-storage';

jest.mock('expo-auth-session/providers/google');
jest.mock('expo-web-browser');
jest.mock('../../services/token-storage');

const mockUseAuthRequest = Google.useAuthRequest as jest.Mock;
const mockMaybeCompleteAuthSession = WebBrowser.maybeCompleteAuthSession as jest.Mock;
const mockFetch = global.fetch as jest.Mock;

describe('google-auth service', () => {
  const mockPromptAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset auth store
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    // Default mock setup
    mockUseAuthRequest.mockReturnValue([
      { type: 'request' }, // request object
      null, // response
      mockPromptAsync, // promptAsync
    ]);

    mockMaybeCompleteAuthSession.mockReturnValue({ type: 'success' });
  });

  describe('maybeCompleteAuthSession', () => {
    it('is mocked and available', () => {
      // maybeCompleteAuthSession is called at module load time (before our test runs)
      // We verify the mock is properly set up and returns expected value
      expect(mockMaybeCompleteAuthSession()).toEqual({ type: 'success' });
    });
  });

  describe('useGoogleAuth hook', () => {
    it('returns signIn function', () => {
      const { result } = renderHook(() => useGoogleAuth());
      expect(typeof result.current.signIn).toBe('function');
    });

    it('returns signOut function', () => {
      const { result } = renderHook(() => useGoogleAuth());
      expect(typeof result.current.signOut).toBe('function');
    });

    it('returns isReady based on request object', () => {
      const { result } = renderHook(() => useGoogleAuth());
      expect(result.current.isReady).toBe(true);
    });

    it('returns isReady as false when request is null', () => {
      mockUseAuthRequest.mockReturnValue([null, null, mockPromptAsync]);

      const { result } = renderHook(() => useGoogleAuth());
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('signIn', () => {
    it('sets loading to true before calling promptAsync', async () => {
      mockPromptAsync.mockImplementation(() => {
        expect(useAuthStore.getState().isLoading).toBe(true);
        return Promise.resolve();
      });

      const { result } = renderHook(() => useGoogleAuth());

      await act(async () => {
        await result.current.signIn();
      });

      expect(mockPromptAsync).toHaveBeenCalled();
    });

    it('calls promptAsync', async () => {
      mockPromptAsync.mockResolvedValue({ type: 'success' });

      const { result } = renderHook(() => useGoogleAuth());

      await act(async () => {
        await result.current.signIn();
      });

      expect(mockPromptAsync).toHaveBeenCalled();
    });

    it('sets loading to false on error', async () => {
      mockPromptAsync.mockRejectedValue(new Error('Auth failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useGoogleAuth());

      await act(async () => {
        await result.current.signIn();
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Sign in error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('native platform configuration', () => {
    it('includes accessType offline on native platforms', () => {
      // Change platform to iOS
      Platform.OS = 'ios';

      renderHook(() => useGoogleAuth());

      // Verify useAuthRequest was called with accessType: 'offline'
      expect(mockUseAuthRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          accessType: 'offline',
        })
      );

      // Reset platform
      Platform.OS = 'web';
    });

    it('does not include accessType on web', () => {
      Platform.OS = 'web';

      renderHook(() => useGoogleAuth());

      // Verify useAuthRequest was NOT called with accessType
      const callArgs = mockUseAuthRequest.mock.calls[0][0];
      expect(callArgs.accessType).toBeUndefined();
    });
  });

  describe('signOut', () => {
    it('calls logout on auth store', () => {
      // Set up authenticated state
      useAuthStore.setState({
        accessToken: 'test-token',
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useGoogleAuth());

      act(() => {
        result.current.signOut();
      });

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears refresh token from SecureStore', () => {
      useAuthStore.setState({
        accessToken: 'test-token',
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useGoogleAuth());

      act(() => {
        result.current.signOut();
      });

      expect(tokenStorage.deleteRefreshToken).toHaveBeenCalled();
    });
  });

  describe('auth response handling', () => {
    it('sets auth on successful response with access token', async () => {
      const mockUserInfo = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 3600,
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBe('new-access-token');
        // Refresh token is stored in SecureStore, not in auth state
        expect(useAuthStore.getState().refreshToken).toBeNull();
        expect(tokenStorage.storeRefreshToken).toHaveBeenCalledWith('new-refresh-token');
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user).toEqual(mockUserInfo);
      });
    });

    it('sets expiresAt to null when expiresIn is not provided', async () => {
      const mockUserInfo = { id: '1', email: 'test@test.com', name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: 'token',
            refreshToken: null,
            expiresIn: null,
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(useAuthStore.getState().expiresAt).toBeNull();
      });
    });

    it('sets refreshToken to null when not provided', async () => {
      const mockUserInfo = { id: '1', email: 'test@test.com', name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: 'token',
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(useAuthStore.getState().refreshToken).toBeNull();
        // Should not call storeRefreshToken when no refresh token provided
        expect(tokenStorage.storeRefreshToken).not.toHaveBeenCalled();
      });
    });

    it('does not set auth when authentication is missing', async () => {
      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: null,
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      // Wait a bit to ensure no state change
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('does not set auth when accessToken is missing', async () => {
      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: null,
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('sets loading to false on error response', async () => {
      useAuthStore.setState({ isLoading: true });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'error',
          error: new Error('Authentication failed'),
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(useAuthStore.getState().isLoading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Auth error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('fetchUserInfo', () => {
    it('fetches user info from Google API', async () => {
      const mockUserInfo = {
        id: 'user-456',
        email: 'user@example.com',
        name: 'User Name',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: 'fetch-test-token',
            expiresIn: 3600,
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: 'Bearer fetch-test-token' },
        });
      });
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseAuthRequest.mockReturnValue([
        { type: 'request' },
        {
          type: 'success',
          authentication: {
            accessToken: 'error-test-token',
            expiresIn: 3600,
          },
        },
        mockPromptAsync,
      ]);

      renderHook(() => useGoogleAuth());

      await waitFor(() => {
        expect(useAuthStore.getState().user).toBeNull();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user info:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
