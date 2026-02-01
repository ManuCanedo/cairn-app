import { useAuthStore } from '../../store/auth';

describe('auth store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('has null accessToken', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('has isAuthenticated as false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('has isLoading as false', () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('sets accessToken correctly', () => {
      useAuthStore.getState().setAuth({
        accessToken: 'test-token',
        refreshToken: null,
        expiresAt: null,
        user: null,
      });

      expect(useAuthStore.getState().accessToken).toBe('test-token');
    });

    it('sets isAuthenticated to true', () => {
      useAuthStore.getState().setAuth({
        accessToken: 'test-token',
        refreshToken: null,
        expiresAt: null,
        user: null,
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets isLoading to false', () => {
      useAuthStore.setState({ isLoading: true });

      useAuthStore.getState().setAuth({
        accessToken: 'test-token',
        refreshToken: null,
        expiresAt: null,
        user: null,
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets user info correctly', () => {
      const user = { id: '1', email: 'test@test.com', name: 'Test User' };

      useAuthStore.getState().setAuth({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        user,
      });

      expect(useAuthStore.getState().user).toEqual(user);
    });
  });

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('sets isLoading to false', () => {
      useAuthStore.setState({ isLoading: true });
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears accessToken', () => {
      useAuthStore.setState({ accessToken: 'some-token' });
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('sets isAuthenticated to false', () => {
      useAuthStore.setState({ isAuthenticated: true });
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears user info', () => {
      useAuthStore.setState({ user: { id: '1', email: 'test@test.com', name: 'Test' } });
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('clears all auth state', () => {
      useAuthStore.setState({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now(),
        user: { id: '1', email: 'test@test.com', name: 'Test' },
        isAuthenticated: true,
        isLoading: true,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when expiresAt is null', () => {
      useAuthStore.setState({ expiresAt: null });
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it('returns true when token has expired', () => {
      useAuthStore.setState({ expiresAt: Date.now() - 1000 });
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });

    it('returns false when token is still valid', () => {
      useAuthStore.setState({ expiresAt: Date.now() + 3600000 });
      expect(useAuthStore.getState().isTokenExpired()).toBe(false);
    });

    it('returns true when token expires exactly now', () => {
      const now = Date.now();
      useAuthStore.setState({ expiresAt: now });
      // Token is expired if Date.now() >= expiresAt
      expect(useAuthStore.getState().isTokenExpired()).toBe(true);
    });
  });
});
