import { render, fireEvent, screen } from '@testing-library/react';
import ActivityPicker from '../../components/ActivityPicker';
import { useActivitiesStore } from '../../store/activities';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
}));

describe('ActivityPicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useActivitiesStore.setState({ templates: [] });
  });

  describe('visibility', () => {
    it('renders nothing when not visible', () => {
      render(<ActivityPicker visible={false} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.queryByTestId('activity-picker-modal')).not.toBeInTheDocument();
    });

    it('renders modal when visible', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByTestId('activity-picker-modal')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no templates exist', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('No activities yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first activity')).toBeInTheDocument();
    });

    it('shows create activity button in empty state', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByTestId('create-activity-button')).toBeInTheDocument();
    });

    it('calls onCreateActivity when create button is pressed', () => {
      const mockOnCreateActivity = jest.fn();
      render(
        <ActivityPicker
          visible={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onCreateActivity={mockOnCreateActivity}
        />
      );

      fireEvent.click(screen.getByTestId('create-activity-button'));

      expect(mockOnCreateActivity).toHaveBeenCalled();
    });
  });

  describe('with activities', () => {
    beforeEach(() => {
      useActivitiesStore.setState({
        templates: [
          { id: '1', name: 'Meditate', emoji: '🧘', colorId: '7', createdAt: 1000 },
          { id: '2', name: 'Exercise', emoji: '💪', colorId: '2', createdAt: 2000 },
          { id: '3', name: 'Read', emoji: '📚', colorId: '5', createdAt: 3000 },
        ],
      });
    });

    it('displays all activities', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('Meditate')).toBeInTheDocument();
      expect(screen.getByText('Exercise')).toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
    });

    it('displays activity emojis', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('🧘')).toBeInTheDocument();
      expect(screen.getByText('💪')).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('calls onSelect with template when activity is pressed', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('activity-item-1'));

      expect(mockOnSelect).toHaveBeenCalledWith({
        id: '1',
        name: 'Meditate',
        emoji: '🧘',
        colorId: '7',
        createdAt: 1000,
      });
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is pressed', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('close-picker-button'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is pressed', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('picker-backdrop'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(
        <ActivityPicker
          visible={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('picker-loading')).toBeInTheDocument();
    });

    it('disables activity buttons when loading', () => {
      useActivitiesStore.setState({
        templates: [{ id: '1', name: 'Test', emoji: '✨', colorId: '1', createdAt: 1000 }],
      });

      render(
        <ActivityPicker
          visible={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          isLoading={true}
        />
      );

      const activityButton = screen.getByTestId('activity-item-1');
      expect(activityButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('title', () => {
    it('shows default title', () => {
      render(<ActivityPicker visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('Log Activity')).toBeInTheDocument();
    });
  });
});
