import { render, fireEvent, screen } from '@testing-library/react';
import { DayCell } from '../../../components/Calendar/DayCell';

describe('DayCell', () => {
  const defaultProps = {
    dayNumber: 15,
    isCurrentMonth: true,
    isToday: false,
    eventColors: [] as readonly string[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the day number', () => {
    render(<DayCell {...defaultProps} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders different day numbers', () => {
    render(<DayCell {...defaultProps} dayNumber={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    render(<DayCell {...defaultProps} onPress={mockOnPress} />);

    fireEvent.click(screen.getByText('15'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash when pressed without onPress handler', () => {
    render(<DayCell {...defaultProps} />);

    expect(() => fireEvent.click(screen.getByText('15'))).not.toThrow();
  });

  describe('event dots', () => {
    it('renders no plus sign when eventColors is empty', () => {
      render(<DayCell {...defaultProps} eventColors={[]} />);

      expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('renders no plus sign for 3 or fewer events', () => {
      render(<DayCell {...defaultProps} eventColors={['1', '2', '3']} />);

      expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('shows plus sign for more than 3 events', () => {
      render(<DayCell {...defaultProps} eventColors={['1', '2', '3', '4']} />);

      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('shows plus sign for many events', () => {
      render(<DayCell {...defaultProps} eventColors={['1', '2', '3', '4', '5', '6']} />);

      expect(screen.getByText('+')).toBeInTheDocument();
    });
  });

  describe('prop edge cases', () => {
    it.each([
      { isCurrentMonth: false, isToday: false },
      { isCurrentMonth: true, isToday: true },
      { isCurrentMonth: false, isToday: true },
    ])(
      'renders with isCurrentMonth=$isCurrentMonth, isToday=$isToday',
      ({ isCurrentMonth, isToday }) => {
        render(<DayCell {...defaultProps} isCurrentMonth={isCurrentMonth} isToday={isToday} />);

        expect(screen.getByText('15')).toBeInTheDocument();
      }
    );

    it('handles zero as day number', () => {
      render(<DayCell {...defaultProps} dayNumber={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles day 31', () => {
      render(<DayCell {...defaultProps} dayNumber={31} />);

      expect(screen.getByText('31')).toBeInTheDocument();
    });
  });
});
