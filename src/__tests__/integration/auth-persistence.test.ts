/**
 * Integration test: Auth Store + AsyncStorage Persistence
 *
 * Tests the integration between Zustand auth store and AsyncStorage.
 * Verifies that state changes trigger actual AsyncStorage operations.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/auth';

describe('Auth Persistence Integration', () => {
  beforeEach(async () => {
    // Clear all mocks and storage between tests
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('auth state management', () => {
    it('setAuth updates all auth fields atomically', () => {
      const testAuth = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: Date.now() + 3600000,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          picture: 'https://example.com/pic.jpg',
        },
      };

      useAuthStore.getState().setAuth(testAuth);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('test-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.user?.email).toBe('test@example.com');
    });

    it('logout clears all auth fields atomically', () => {
      // Set up authenticated state
      useAuthStore.getState().setAuth({
        accessToken: 'token-to-clear',
        refreshToken: 'refresh-to-clear',
        expiresAt: Date.now() + 3600000,
        user: { id: '1', name: 'User', email: 'user@example.com' },
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('setLoading updates loading state independently', () => {
      expect(useAuthStore.getState().isLoading).toBe(false);

      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('token expiry detection', () => {
    it('correctly identifies expired tokens', () => {
      useAuthStore.getState().setAuth({
        accessToken: 'expired-token',
        refreshToken: null,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        user: { id: '1', name: 'User', email: 'user@example.com' },
      });

      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it('correctly identifies valid tokens', () => {
      useAuthStore.getState().setAuth({
        accessToken: 'valid-token',
        refreshToken: null,
        expiresAt: Date.now() + 3600000, // Expires in 1 hour
        user: { id: '1', name: 'User', email: 'user@example.com' },
      });

      expect(useAuthStore.getState().isTokenExpired()).toBe(false);
    });

    it('treats null expiresAt as expired', () => {
      useAuthStore.getState().setAuth({
        accessToken: 'token-no-expiry',
        refreshToken: null,
        expiresAt: null,
        user: { id: '1', name: 'User', email: 'user@example.com' },
      });

      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it('treats token expiring exactly now as expired', () => {
      const now = Date.now();
      useAuthStore.getState().setAuth({
        accessToken: 'token-expiring-now',
        refreshToken: null,
        expiresAt: now,
        user: { id: '1', name: 'User', email: 'user@example.com' },
      });

      // expiresAt === now means Date.now() >= expiresAt is true
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });
  });

  describe('persistence configuration', () => {
    it('has persist middleware configured', () => {
      // Verify the store has persist capabilities
      expect(useAuthStore.persist).toBeDefined();
      expect(typeof useAuthStore.persist.rehydrate).toBe('function');
    });

    it('uses correct storage key', () => {
      // The storage key should be 'cairn-auth'
      expect(useAuthStore.persist.getOptions().name).toBe('cairn-auth');
    });
  });

  describe('AsyncStorage integration', () => {
    it('calls AsyncStorage.setItem when auth state changes', async () => {
      // Act - update auth state
      useAuthStore.getState().setAuth({
        accessToken: 'persist-test-token',
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        user: { id: '1', name: 'Test', email: 'test@example.com' },
      });

      // Wait for async persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'cairn-auth',
        expect.any(String)
      );

      // Verify the persisted data contains expected fields
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const persistedData = JSON.parse(lastCall[1]);

      expect(persistedData.state.accessToken).toBe('persist-test-token');
      expect(persistedData.state.isAuthenticated).toBe(true);
    });

    it('calls AsyncStorage.setItem when logout clears state', async () => {
      // Arrange - set up authenticated state
      useAuthStore.getState().setAuth({
        accessToken: 'token-to-logout',
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        user: { id: '1', name: 'Test', email: 'test@example.com' },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clear mock to track only logout calls
      jest.clearAllMocks();

      // Act - logout
      useAuthStore.getState().logout();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - verify AsyncStorage was called with cleared state
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'cairn-auth',
        expect.any(String)
      );

      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const persistedData = JSON.parse(lastCall[1]);

      expect(persistedData.state.accessToken).toBeNull();
      expect(persistedData.state.isAuthenticated).toBe(false);
    });

    it('calls AsyncStorage.getItem during rehydration', async () => {
      // Clear mocks to track rehydration calls
      jest.clearAllMocks();

      // Act - trigger rehydration
      await useAuthStore.persist.rehydrate();

      // Assert - verify AsyncStorage.getItem was called with correct key
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('cairn-auth');
    });

    it('partializes state correctly (excludes isLoading)', async () => {
      // Act - set auth with loading state
      useAuthStore.setState({ isLoading: true });
      useAuthStore.getState().setAuth({
        accessToken: 'partialize-test',
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        user: { id: '1', name: 'Test', email: 'test@example.com' },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - verify persisted data does NOT include isLoading
      // (per auth.ts partialize config, isLoading is excluded)
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const persistedData = JSON.parse(lastCall[1]);

      // isLoading should not be persisted (or should be undefined)
      expect(persistedData.state.isLoading).toBeUndefined();
      // But auth fields should be persisted
      expect(persistedData.state.accessToken).toBe('partialize-test');
    });
  });
});
