import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../store/auth';
import { useGoogleAuth } from '../../services/google-auth';
import { getOrCreateCairnCalendar, listEvents } from '../../services/google-calendar';
import HomeScreen from '../../../app/index';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options?: { headerRight?: () => React.ReactNode } }) => {
      return options?.headerRight ? options.headerRight() : null;
    },
  },
}));

// Mock useGoogleAuth
jest.mock('../../services/google-auth', () => ({
  useGoogleAuth: jest.fn(),
}));

// Mock google-calendar service
jest.mock('../../services/google-calendar', () => ({
  getOrCreateCairnCalendar: jest.fn(),
  listEvents: jest.fn(),
}));

// Mock MonthView component with data-testid for web testing
jest.mock('../../components/Calendar', () => ({
  MonthView: ({
    onDayPress,
    onMonthChange,
  }: {
    events?: unknown[];
    onDayPress?: (date: string) => void;
    onMonthChange?: (year: number, month: number) => void;
  }) => (
    <div data-testid="month-view">
      <button data-testid="day-press-button" onClick={() => onDayPress?.('2026-02-01')}>
        Press Day
      </button>
      <button data-testid="month-change-button" onClick={() => onMonthChange?.(2026, 3)}>
        Change Month
      </button>
    </div>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  startOfMonth: () => new Date('2026-02-01'),
  endOfMonth: (date: Date) => {
    if (date.getMonth() === 1) return new Date('2026-02-28');
    if (date.getMonth() === 2) return new Date('2026-03-31');
    return new Date('2026-02-28');
  },
  format: (date: Date, _formatStr: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
}));

const mockSignOut = jest.fn();

describe('HomeScreen', () => {
  const mockUser = {
    id: '1',
    email: 'test@test.com',
    name: 'John Doe',
    picture: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useGoogleAuth as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      signOut: mockSignOut,
      isReady: true,
    });

    (getOrCreateCairnCalendar as jest.Mock).mockResolvedValue('test-calendar-id');
    (listEvents as jest.Mock).mockResolvedValue([]);

    useAuthStore.setState({
      accessToken: 'test-token',
      refreshToken: null,
      expiresAt: Date.now() + 3600000,
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
    });
  });

  describe('rendering', () => {
    it('renders user greeting with first name', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Hello.*John/)).toBeInTheDocument();
      });
    });

    it('renders "there" when user name is null', async () => {
      useAuthStore.setState({
        ...useAuthStore.getState(),
        user: { id: '1', email: 'test@test.com', name: null as unknown as string },
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Hello.*there/)).toBeInTheDocument();
      });
    });

    it('renders the floating add button', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('+')).toBeInTheDocument();
      });
    });
  });

  describe('calendar initialization', () => {
    it('calls getOrCreateCairnCalendar on mount when authenticated', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(getOrCreateCairnCalendar).toHaveBeenCalled();
      });
    });

    it('calls listEvents after calendar is created', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(listEvents).toHaveBeenCalled();
      });
    });

    it('does not initialize when not authenticated', async () => {
      useAuthStore.setState({
        ...useAuthStore.getState(),
        isAuthenticated: false,
      });

      render(<HomeScreen />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(getOrCreateCairnCalendar).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator initially', () => {
      (getOrCreateCairnCalendar as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<HomeScreen />);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('hides loading indicator after initialization completes', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on initialization failure', async () => {
      (getOrCreateCairnCalendar as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (getOrCreateCairnCalendar as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('month change', () => {
    it('renders MonthView after loading', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('month-view')).toBeInTheDocument();
      });
    });

    it('fetches events for new month when onMonthChange is called', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('month-view')).toBeInTheDocument();
      });

      jest.clearAllMocks();

      const monthChangeButton = screen.getByTestId('month-change-button');
      fireEvent.click(monthChangeButton);

      await waitFor(() => {
        expect(listEvents).toHaveBeenCalled();
      });
    });

    it('displays error when month change fails', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('month-view')).toBeInTheDocument();
      });

      // Make listEvents fail on month change
      (listEvents as jest.Mock).mockRejectedValueOnce(new Error('Month change error'));

      const monthChangeButton = screen.getByTestId('month-change-button');
      fireEvent.click(monthChangeButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to load events')).toBeInTheDocument();
      });
    });

    it('does not fetch when calendarId is null', async () => {
      // Make calendar creation fail
      (getOrCreateCairnCalendar as jest.Mock).mockRejectedValue(new Error('Cal error'));

      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
      });

      jest.clearAllMocks();

      // Even if we click retry, without calendarId, listEvents shouldn't be called
      // The retry button calls handleMonthChange which checks for calendarId
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Give some time for any async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // listEvents should not have been called since calendarId is null
      expect(listEvents).not.toHaveBeenCalled();
    });
  });

  describe('day press', () => {
    it('handles day press callback without error', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('month-view')).toBeInTheDocument();
      });

      const dayPressButton = screen.getByTestId('day-press-button');
      fireEvent.click(dayPressButton);

      expect(screen.getByTestId('month-view')).toBeInTheDocument();
    });
  });

  describe('sign out', () => {
    it('calls signOut when sign out button is pressed', async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
