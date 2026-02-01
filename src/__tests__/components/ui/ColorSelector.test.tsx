import { render, fireEvent, screen } from '@testing-library/react';
import { ColorSelector, GOOGLE_COLORS } from '../../../components/ui/ColorSelector';

describe('ColorSelector', () => {
  const defaultProps = {
    selectedColorId: '1',
    onSelectColor: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 11 color options', () => {
    render(<ColorSelector {...defaultProps} />);

    GOOGLE_COLORS.forEach((color) => {
      expect(screen.getByTestId(`color-${color.id}`)).toBeInTheDocument();
    });
  });

  it('calls onSelectColor when a color is pressed', () => {
    const onSelectColor = jest.fn();
    render(<ColorSelector {...defaultProps} onSelectColor={onSelectColor} />);

    fireEvent.click(screen.getByTestId('color-5'));

    expect(onSelectColor).toHaveBeenCalledWith('5');
  });

  it('has accessibility labels for each color', () => {
    render(<ColorSelector {...defaultProps} />);

    expect(screen.getByLabelText('Lavender')).toBeInTheDocument();
    expect(screen.getByLabelText('Peacock')).toBeInTheDocument();
    expect(screen.getByLabelText('Tomato')).toBeInTheDocument();
  });

  it('renders with different selected colors', () => {
    const { rerender } = render(<ColorSelector selectedColorId="7" onSelectColor={jest.fn()} />);
    expect(screen.getByTestId('color-7')).toBeInTheDocument();

    rerender(<ColorSelector selectedColorId="11" onSelectColor={jest.fn()} />);
    expect(screen.getByTestId('color-11')).toBeInTheDocument();
  });
});
