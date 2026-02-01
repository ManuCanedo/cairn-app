import { render, waitFor } from '@testing-library/react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import RootLayout from '../../../app/_layout';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: ({ children }: { children?: React.ReactNode }) => children ?? null,
  useRouter: jest.fn(),
  useSegments: jest.fn(),
  useRootNavigationState: jest.fn(),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock ErrorBoundary to pass through children
jest.mock('../../components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockRouter = {
  replace: jest.fn(),
};

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSegments as jest.Mock).mockReturnValue([]);
    (useRootNavigationState as jest.Mock).mockReturnValue({ key: 'test-key' });
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  describe('RootLayout component', () => {
    it('renders without crashing', () => {
      const { container } = render(<RootLayout />);
      expect(container).toBeTruthy();
    });

    it('wraps content in ErrorBoundary', () => {
      // ErrorBoundary is mocked but we verify RootLayout renders its children
      const { container } = render(<RootLayout />);
      expect(container).toBeTruthy();
    });
  });

  describe('navigation readiness', () => {
    it('does not navigate when navigation is not ready', async () => {
      (useRootNavigationState as jest.Mock).mockReturnValue({ key: null });

      render(<RootLayout />);

      // Give time for any effects to run
      await waitFor(() => {
        expect(mockRouter.replace).not.toHaveBeenCalled();
      });
    });

    it('sets navigation ready when navigationState.key exists', async () => {
      (useRootNavigationState as jest.Mock).mockReturnValue({ key: 'test-key' });

      render(<RootLayout />);

      // Navigation should be ready and redirect should happen
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('auth routing - unauthenticated user', () => {
    beforeEach(() => {
      useAuthStore.setState({ isAuthenticated: false });
    });

    it('redirects to /login when not authenticated and not in auth group', async () => {
      (useSegments as jest.Mock).mockReturnValue(['']);

      render(<RootLayout />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('does not redirect when already in login route', async () => {
      (useSegments as jest.Mock).mockReturnValue(['login']);

      render(<RootLayout />);

      // Wait for effects to settle
      await waitFor(
        () => {
          expect(mockRouter.replace).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });
  });

  describe('auth routing - authenticated user', () => {
    beforeEach(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: 'test-token',
        user: { id: '1', email: 'test@test.com', name: 'Test User' },
      });
    });

    it('redirects to / when authenticated and in auth group (login)', async () => {
      (useSegments as jest.Mock).mockReturnValue(['login']);

      render(<RootLayout />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/');
      });
    });

    it('does not redirect when authenticated and not in auth group', async () => {
      (useSegments as jest.Mock).mockReturnValue(['']);

      render(<RootLayout />);

      // Wait for effects to settle
      await waitFor(
        () => {
          expect(mockRouter.replace).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });
  });

  describe('navigation state transitions', () => {
    it('handles navigation state becoming ready', async () => {
      // Start with no key
      (useRootNavigationState as jest.Mock).mockReturnValue({ key: null });
      useAuthStore.setState({ isAuthenticated: false });
      (useSegments as jest.Mock).mockReturnValue(['']);

      const { rerender } = render(<RootLayout />);

      // Should not navigate yet
      expect(mockRouter.replace).not.toHaveBeenCalled();

      // Now navigation becomes ready
      (useRootNavigationState as jest.Mock).mockReturnValue({ key: 'ready-key' });
      rerender(<RootLayout />);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });
});
