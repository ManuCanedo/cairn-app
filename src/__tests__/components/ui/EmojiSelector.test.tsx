import { render, fireEvent, screen } from '@testing-library/react';
import { EmojiSelector, SUGGESTED_EMOJIS } from '../../../components/ui/EmojiSelector';

describe('EmojiSelector', () => {
  const defaultProps = {
    selectedEmoji: '🧘',
    onSelectEmoji: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all suggested emojis', () => {
    render(<EmojiSelector {...defaultProps} />);

    SUGGESTED_EMOJIS.forEach((emoji) => {
      expect(screen.getByText(emoji)).toBeInTheDocument();
    });
  });

  it('calls onSelectEmoji when an emoji is pressed', () => {
    const onSelectEmoji = jest.fn();
    render(<EmojiSelector {...defaultProps} onSelectEmoji={onSelectEmoji} />);

    fireEvent.click(screen.getByText('💪'));

    expect(onSelectEmoji).toHaveBeenCalledWith('💪');
  });

  it('shows correct number of emoji options', () => {
    render(<EmojiSelector {...defaultProps} />);

    // 16 suggested emojis
    expect(SUGGESTED_EMOJIS).toHaveLength(16);
  });

  it('renders with different selected emojis', () => {
    const { rerender } = render(<EmojiSelector selectedEmoji="💧" onSelectEmoji={jest.fn()} />);
    expect(screen.getByTestId('emoji-💧')).toBeInTheDocument();

    rerender(<EmojiSelector selectedEmoji="🧘" onSelectEmoji={jest.fn()} />);
    expect(screen.getByTestId('emoji-🧘')).toBeInTheDocument();
  });
});
