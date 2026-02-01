import { render, screen, fireEvent } from '@testing-library/react';
import { Redirect } from 'expo-router';
import { useGoogleAuth } from '../../services/google-auth';
import { useAuthStore } from '../../store/auth';
import LoginScreen from '../../../app/login';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  Redirect: jest.fn(() => null),
}));

// Mock useGoogleAuth
jest.mock('../../services/google-auth', () => ({
  useGoogleAuth: jest.fn(),
}));

const mockSignIn = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGoogleAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signOut: jest.fn(),
      isReady: true,
    });
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  describe('redirect when authenticated', () => {
    it('redirects to / when already authenticated', () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<LoginScreen />);

      expect(Redirect).toHaveBeenCalled();
      const calls = (Redirect as jest.Mock).mock.calls;
      expect(calls[0][0]).toEqual({ href: '/' });
    });

    it('does not redirect when not authenticated', () => {
      useAuthStore.setState({ isAuthenticated: false });

      render(<LoginScreen />);

      expect(Redirect).not.toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('renders the logo emoji', () => {
      render(<LoginScreen />);
      expect(screen.getByText('🪨')).toBeInTheDocument();
    });

    it('renders the title "Cairn"', () => {
      render(<LoginScreen />);
      expect(screen.getByText('Cairn')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<LoginScreen />);
      expect(screen.getByText(/Stack your habits/)).toBeInTheDocument();
    });

    it('renders the Google sign-in button', () => {
      render(<LoginScreen />);
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('renders the disclaimer text', () => {
      render(<LoginScreen />);
      expect(
        screen.getByText(/Google Calendar to track your positive activities/)
      ).toBeInTheDocument();
    });
  });

  describe('button state', () => {
    it('shows "Signing in..." text when loading', () => {
      useAuthStore.setState({ isLoading: true });

      render(<LoginScreen />);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
    });

    it('shows "Continue with Google" when not loading', () => {
      useAuthStore.setState({ isLoading: false });

      render(<LoginScreen />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  describe('sign in interaction', () => {
    it('calls signIn when button is pressed', () => {
      render(<LoginScreen />);

      const button = screen.getByText('Continue with Google');
      fireEvent.click(button);

      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });

    it('button calls signIn handler from useGoogleAuth', () => {
      const customSignIn = jest.fn();
      (useGoogleAuth as jest.Mock).mockReturnValue({
        signIn: customSignIn,
        isReady: true,
      });

      render(<LoginScreen />);

      const button = screen.getByText('Continue with Google');
      fireEvent.click(button);

      expect(customSignIn).toHaveBeenCalledTimes(1);
    });
  });
});
