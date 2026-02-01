import { render, fireEvent, screen } from '@testing-library/react';
import { useRouter } from 'expo-router';
import ActivitiesListScreen from '../../../../app/activities/index';
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
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

describe('ActivitiesListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    useActivitiesStore.setState({ templates: [] });
  });

  it('shows empty state when no templates exist', () => {
    render(<ActivitiesListScreen />);

    expect(screen.getByText('No activities yet')).toBeInTheDocument();
    expect(screen.getByText('Create Activity')).toBeInTheDocument();
  });

  it('navigates to edit screen when add button is pressed', () => {
    render(<ActivitiesListScreen />);

    fireEvent.click(screen.getByTestId('add-activity'));

    expect(mockRouter.push).toHaveBeenCalledWith('/activities/edit');
  });

  it('shows activity list when templates exist', () => {
    useActivitiesStore.setState({
      templates: [
        { id: '1', name: 'Meditate', emoji: '🧘', colorId: '7', createdAt: 1000 },
        { id: '2', name: 'Exercise', emoji: '💪', colorId: '2', createdAt: 2000 },
      ],
    });

    render(<ActivitiesListScreen />);

    expect(screen.getByText('Meditate')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('🧘')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('navigates to edit screen when activity is pressed', () => {
    useActivitiesStore.setState({
      templates: [{ id: 'abc', name: 'Test', emoji: '✨', colorId: '1', createdAt: 1000 }],
    });

    render(<ActivitiesListScreen />);
    fireEvent.click(screen.getByTestId('activity-abc'));

    expect(mockRouter.push).toHaveBeenCalledWith('/activities/edit?id=abc');
  });

  it('deletes activity when delete button is pressed', () => {
    useActivitiesStore.setState({
      templates: [{ id: 'del-me', name: 'Delete Me', emoji: '🗑️', colorId: '11', createdAt: 1000 }],
    });

    render(<ActivitiesListScreen />);
    expect(screen.getByText('Delete Me')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('delete-del-me'));

    expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
    expect(screen.getByText('No activities yet')).toBeInTheDocument();
  });
});
