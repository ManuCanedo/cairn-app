import { render, fireEvent, screen } from '@testing-library/react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EditActivityScreen from '../../../../app/activities/edit';
import { useActivitiesStore } from '../../../store/activities';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { title: string; headerRight?: () => React.ReactNode } }) => (
      <div data-testid="stack-screen" data-title={options.title}>
        {options.headerRight?.()}
      </div>
    ),
  },
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'new-uuid-123'),
}));

// Mock Alert (defensive - button is disabled when name is empty, so this is rarely reached)
jest.spyOn(require('react-native').Alert, 'alert');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

describe('EditActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    useActivitiesStore.setState({ templates: [] });
  });

  describe('create mode', () => {
    it('shows "New Activity" title', () => {
      render(<EditActivityScreen />);

      expect(screen.getByTestId('stack-screen')).toHaveAttribute('data-title', 'New Activity');
    });

    it('has empty name input initially', () => {
      render(<EditActivityScreen />);

      const input = screen.getByTestId('activity-name-input');
      expect(input).toHaveValue('');
    });

    it('shows default emoji in selector', () => {
      render(<EditActivityScreen />);

      // Default emoji should be visible in selector
      expect(screen.getByTestId('emoji-🧘')).toBeInTheDocument();
    });

    it('updates preview when name is typed', () => {
      render(<EditActivityScreen />);

      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: 'My Activity' } });

      expect(screen.getByText('My Activity')).toBeInTheDocument();
    });

    it('creates activity and navigates back on save', () => {
      render(<EditActivityScreen />);

      // Type a name
      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: 'New Habit' } });

      // Click save
      fireEvent.click(screen.getByTestId('save-activity'));

      // Should add to store and go back
      const { templates } = useActivitiesStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('New Habit');
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('disables save button when name is empty', () => {
      render(<EditActivityScreen />);

      const saveButton = screen.getByTestId('save-activity');
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('disables save button when name is whitespace-only', () => {
      render(<EditActivityScreen />);

      // Enter whitespace-only name
      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: '   ' } });

      const saveButton = screen.getByTestId('save-activity');
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('enables save button when name has content', () => {
      render(<EditActivityScreen />);

      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: 'Test Activity' } });

      const saveButton = screen.getByTestId('save-activity');
      expect(saveButton).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'existing-123' });
      useActivitiesStore.setState({
        templates: [
          { id: 'existing-123', name: 'Meditate', emoji: '🧘', colorId: '7', createdAt: 1000 },
        ],
      });
    });

    it('shows "Edit Activity" title', () => {
      render(<EditActivityScreen />);

      expect(screen.getByTestId('stack-screen')).toHaveAttribute('data-title', 'Edit Activity');
    });

    it('populates form with existing data', () => {
      render(<EditActivityScreen />);

      const input = screen.getByTestId('activity-name-input');
      expect(input).toHaveValue('Meditate');
    });

    it('updates existing activity on save', () => {
      render(<EditActivityScreen />);

      // Change the name
      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: 'Deep Meditation' } });

      // Click save
      fireEvent.click(screen.getByTestId('save-activity'));

      // Should update in store
      const { templates } = useActivitiesStore.getState();
      expect(templates[0].name).toBe('Deep Meditation');
      expect(templates[0].id).toBe('existing-123'); // Same ID
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('emoji selection', () => {
    it('updates emoji when selected', () => {
      render(<EditActivityScreen />);

      // Default is 🧘, select 💪
      fireEvent.click(screen.getByTestId('emoji-💪'));

      // Preview should show new emoji
      expect(screen.getAllByText('💪').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('color selection', () => {
    it('updates color when selected', () => {
      render(<EditActivityScreen />);

      // Select a different color
      fireEvent.click(screen.getByTestId('color-11'));

      // Should be selected (test by saving and checking store)
      const input = screen.getByTestId('activity-name-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByTestId('save-activity'));

      const { templates } = useActivitiesStore.getState();
      expect(templates[0].colorId).toBe('11');
    });
  });
});
