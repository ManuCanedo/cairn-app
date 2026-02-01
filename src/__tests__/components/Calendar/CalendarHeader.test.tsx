import { render, fireEvent, screen } from '@testing-library/react';
import { CalendarHeader } from '../../../components/Calendar/CalendarHeader';

describe('CalendarHeader', () => {
  const mockOnPrevMonth = jest.fn();
  const mockOnNextMonth = jest.fn();
  const testDate = new Date(2026, 0, 15); // January 15, 2026

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the month and year', () => {
    render(
      <CalendarHeader
        currentDate={testDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('renders previous month button', () => {
    render(
      <CalendarHeader
        currentDate={testDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('<')).toBeInTheDocument();
  });

  it('renders next month button', () => {
    render(
      <CalendarHeader
        currentDate={testDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('>')).toBeInTheDocument();
  });

  it('calls onPrevMonth when previous button is pressed', () => {
    render(
      <CalendarHeader
        currentDate={testDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    fireEvent.click(screen.getByText('<'));

    expect(mockOnPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button is pressed', () => {
    render(
      <CalendarHeader
        currentDate={testDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    fireEvent.click(screen.getByText('>'));

    expect(mockOnNextMonth).toHaveBeenCalledTimes(1);
  });

  it('displays different months correctly', () => {
    const december = new Date(2026, 11, 25); // December 25, 2026

    render(
      <CalendarHeader
        currentDate={december}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('December 2026')).toBeInTheDocument();
  });

  it('displays different years correctly', () => {
    const futureDate = new Date(2030, 5, 15); // June 15, 2030

    render(
      <CalendarHeader
        currentDate={futureDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('June 2030')).toBeInTheDocument();
  });
});
