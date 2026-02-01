import { render, fireEvent, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <span>Normal content</span>;
};

// Component that throws error without message
const ThrowingComponentNoMessage = () => {
  throw new Error();
};

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ErrorBoundary>
          <span>Child content</span>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <span>First child</span>
          <span>Second child</span>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('renders default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(':(')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      const customFallback = <span>Custom error view</span>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error view')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('shows default message when error has no message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponentNoMessage />
        </ErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('retry functionality', () => {
    it('resets error state when Try Again is pressed', () => {
      let shouldThrow = true;

      const ConditionalThrower = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <span>Recovered content</span>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Press retry
      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('shows error again if retry still throws', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Try Again'));

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('getDerivedStateFromError', () => {
    it('returns error state object', () => {
      const error = new Error('Test');
      const result = ErrorBoundary.getDerivedStateFromError(error);

      expect(result).toEqual({
        hasError: true,
        error,
      });
    });
  });
});
