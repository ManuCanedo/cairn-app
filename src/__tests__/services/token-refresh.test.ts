/**
 * Tests for token-refresh service
 *
 * Handles token refresh logic with:
 * - Concurrency handling (single refresh at a time)
 * - Platform-aware behavior (native vs web)
 * - Error handling for failed refreshes
 */
import { Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import * as tokenStorage from '../../services/token-storage';
import {
  refreshAccessToken,
  getValidAccessToken,
  TokenRefreshError,
} from '../../services/token-refresh';

// Mock token-storage
jest.mock('../../services/token-storage');

// Mock fetch for token refresh requests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('token-refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth store
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('exchanges refresh token for new access token', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            expires_in: 3600,
            refresh_token: 'new-refresh-token',
          }),
      });

      const result = await refreshAccessToken();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('stores new refresh token if provided', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            expires_in: 3600,
            refresh_token: 'rotated-refresh-token',
          }),
      });

      await refreshAccessToken();

      expect(tokenStorage.storeRefreshToken).toHaveBeenCalledWith('rotated-refresh-token');
    });

    it('throws TokenRefreshError when no refresh token available', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(refreshAccessToken()).rejects.toThrow(TokenRefreshError);
      await expect(refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('throws TokenRefreshError on API failure', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'invalid_grant',
            error_description: 'Token has been revoked',
          }),
      });

      await expect(refreshAccessToken()).rejects.toThrow(TokenRefreshError);
    });

    it('clears refresh token on invalid_grant error', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('revoked-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'invalid_grant',
          }),
      });

      await expect(refreshAccessToken()).rejects.toThrow(TokenRefreshError);
      expect(tokenStorage.deleteRefreshToken).toHaveBeenCalled();
    });

    it('throws TokenRefreshError on non-invalid_grant API error', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: 'server_error',
            error_description: 'Internal server error',
          }),
      });

      await expect(refreshAccessToken()).rejects.toThrow('Internal server error');
      // Should NOT clear refresh token for non-invalid_grant errors
      expect(tokenStorage.deleteRefreshToken).not.toHaveBeenCalled();
    });

    it('uses default message when error_description is missing', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: 'server_error',
            // No error_description provided
          }),
      });

      await expect(refreshAccessToken()).rejects.toThrow('Token refresh failed');
    });

    it('handles concurrent refresh requests (only one actual refresh)', async () => {
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      let resolveRefresh: (value: unknown) => void;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });
      mockFetch.mockReturnValue(refreshPromise);

      // Start two concurrent refresh requests
      const promise1 = refreshAccessToken();
      const promise2 = refreshAccessToken();

      // Resolve the single fetch call
      resolveRefresh!({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'shared-token',
            expires_in: 3600,
          }),
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same result
      expect(result1.accessToken).toBe('shared-token');
      expect(result2.accessToken).toBe('shared-token');
      // But fetch should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getValidAccessToken', () => {
    it('returns current token if not expired', async () => {
      useAuthStore.setState({
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        isAuthenticated: true,
      });

      const token = await getValidAccessToken();

      expect(token).toBe('valid-token');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('refreshes token if expired (native)', async () => {
      Platform.OS = 'ios';
      useAuthStore.setState({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // Expired
        isAuthenticated: true,
      });
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'refreshed-token',
            expires_in: 3600,
          }),
      });

      const token = await getValidAccessToken();

      expect(token).toBe('refreshed-token');
    });

    it('returns null if expired on web (no refresh possible)', async () => {
      Platform.OS = 'web';
      useAuthStore.setState({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // Expired
        isAuthenticated: true,
      });

      const token = await getValidAccessToken();

      expect(token).toBeNull();
    });

    it('returns current token if expiring soon on web (cannot refresh)', async () => {
      Platform.OS = 'web';
      useAuthStore.setState({
        accessToken: 'expiring-soon-token',
        expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes (within buffer but not expired)
        isAuthenticated: true,
      });

      const token = await getValidAccessToken();

      // Web can't refresh, so return current token even though it's expiring soon
      expect(token).toBe('expiring-soon-token');
    });

    it('returns null if not authenticated', async () => {
      useAuthStore.setState({
        accessToken: null,
        isAuthenticated: false,
      });

      const token = await getValidAccessToken();

      expect(token).toBeNull();
    });

    it('refreshes token if expiring soon (within 5 minutes)', async () => {
      Platform.OS = 'ios';
      useAuthStore.setState({
        accessToken: 'almost-expired-token',
        expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes from now
        isAuthenticated: true,
      });
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'refreshed-token',
            expires_in: 3600,
          }),
      });

      const token = await getValidAccessToken();

      expect(token).toBe('refreshed-token');
    });

    it('updates auth store after successful refresh', async () => {
      Platform.OS = 'ios';
      useAuthStore.setState({
        accessToken: 'old-token',
        expiresAt: Date.now() - 1000,
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com' },
      });
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-token',
            expires_in: 3600,
          }),
      });

      await getValidAccessToken();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-token');
      expect(state.expiresAt).toBeGreaterThan(Date.now());
    });

    it('returns null when refresh throws an error (native)', async () => {
      Platform.OS = 'ios';
      useAuthStore.setState({
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // Expired
        isAuthenticated: true,
      });
      (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('invalid-refresh-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'invalid_grant',
            error_description: 'Token revoked',
          }),
      });

      const token = await getValidAccessToken();

      expect(token).toBeNull();
    });
  });
});
