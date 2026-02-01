# Cairn Development Guide

## Development Philosophy

### Test-Driven Development (TDD)

**All new features MUST follow TDD methodology:**

1. **Red** - Write a failing test first
2. **Green** - Write the minimum code to make the test pass
3. **Refactor** - Improve the code while keeping tests green

### Coverage Requirements

| Type | Minimum Coverage |
|------|------------------|
| Unit Tests | 100% |
| Integration Tests | 0% (not yet implemented) |
| E2E Tests (future) | Critical paths |

### TDD Workflow

```
1. Create test file: __tests__/[feature].test.ts
2. Write test case for new functionality (RED)
3. Run: npm test -- --watch
4. See test fail (confirms test is valid)
5. Implement minimum code to pass (GREEN)
6. Refactor if needed (REFACTOR)
7. Repeat for next test case
8. Check coverage: npm run test:coverage
```

---

## Testing Stack

- **Jest** - Test runner
- **React Native Testing Library** - Component testing
- **jest-expo** - Expo-specific Jest preset

### Installation

```bash
npm install --save-dev jest @testing-library/react-native jest-expo @types/jest
```

### Configuration

Jest is configured in `jest.config.js`:
- Preset: `jest-expo/web`
- Coverage threshold: 100% for all metrics
- Test match: `**/__tests__/**/*.test.{ts,tsx}`
- Uses `@testing-library/react` for component tests (web-compatible)
- Uses `@testing-library/react-native` for hook tests

---

## Test File Structure

```
src/
├── __tests__/
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── CalendarHeader.test.tsx
│   │   │   ├── DayCell.test.tsx
│   │   │   └── MonthView.test.tsx
│   │   └── ui/
│   │       └── ErrorBoundary.test.tsx
│   ├── services/
│   │   ├── google-auth.test.ts
│   │   └── google-calendar.test.ts
│   ├── store/
│   │   └── auth.test.ts
│   └── utils/
│       └── colors.test.ts
```

---

## Testing Guidelines

### 1. Unit Tests

Test individual functions/components in isolation:

```typescript
// src/__tests__/utils/colors.test.ts
import { getEventColor, GOOGLE_CALENDAR_COLORS } from '../../components/Calendar/colors';

describe('getEventColor', () => {
  it('returns correct color for valid colorId', () => {
    expect(getEventColor('1')).toBe('#7986cb');
  });

  it('returns default color for undefined colorId', () => {
    expect(getEventColor(undefined)).toBe('#4F46E5');
  });

  it('returns default color for invalid colorId', () => {
    expect(getEventColor('999')).toBe('#4F46E5');
  });
});
```

### 2. Component Tests

Test component rendering and interactions:

```typescript
// src/__tests__/components/Calendar/DayCell.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { DayCell } from '../../../components/Calendar/DayCell';

describe('DayCell', () => {
  it('renders day number', () => {
    const { getByText } = render(
      <DayCell dayNumber={15} isCurrentMonth={true} isToday={false} eventColors={[]} />
    );
    expect(getByText('15')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <DayCell dayNumber={15} isCurrentMonth={true} isToday={false} eventColors={[]} onPress={onPress} />
    );
    fireEvent.press(getByText('15'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### 3. Service Tests (with Mocks)

Mock external APIs:

```typescript
// src/__tests__/services/google-calendar.test.ts
import { listEvents, getOrCreateCairnCalendar } from '../../services/google-calendar';

// Mock fetch globally
global.fetch = jest.fn();

describe('google-calendar service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listEvents', () => {
    it('returns events from API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [{ id: '1', summary: 'Test' }] }),
      });

      const events = await listEvents('token', 'calendarId', '2026-01-01', '2026-01-31');
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Test');
    });

    it('throws AuthExpiredError on 401', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      await expect(listEvents('token', 'calendarId', '2026-01-01', '2026-01-31'))
        .rejects.toThrow('Session expired');
    });
  });
});
```

### 4. Store Tests

Test Zustand stores:

```typescript
// src/__tests__/store/auth.test.ts
import { useAuthStore } from '../../store/auth';

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('setAuth updates state correctly', () => {
    const auth = {
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
      user: { id: '1', email: 'test@test.com', name: 'Test' },
    };

    useAuthStore.getState().setAuth(auth);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('test-token');
  });

  it('isTokenExpired returns true when token expired', () => {
    useAuthStore.setState({ expiresAt: Date.now() - 1000 });
    expect(useAuthStore.getState().isTokenExpired()).toBe(true);
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/services/google-calendar.test.ts
```

---

## Coverage Report

After running `npm run test:coverage`, check:

1. **Terminal output** - Summary of coverage percentages
2. **coverage/lcov-report/index.html** - Detailed HTML report

### Coverage Thresholds

The project enforces 100% coverage:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
}
```

---

## Mocking Strategy

### Google APIs
- Mock `fetch` globally for API calls
- Create mock response factories for common responses

### Expo Modules
- Use `jest.mock('expo-constants')` for config
- Use `jest.mock('expo-auth-session/providers/google')` for OAuth

### AsyncStorage
- Use `@react-native-async-storage/async-storage/jest/async-storage-mock`

### Navigation
- Use `jest.mock('expo-router')` for navigation mocks

---

## Test Requirements for AI Agents

When writing tests, AI agents MUST follow these rules:

### 1. No Coverage-Only Tests

**Bad:**
```typescript
it('exports MonthView', () => {
  expect(MonthView).toBeDefined();
});
```

**Good:**
```typescript
it('renders current month by default', () => {
  render(<MonthView events={[]} onMonthChange={jest.fn()} />);
  expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
});
```

### 2. Mock at Boundaries Only

Mock external services (fetch, AsyncStorage, expo modules), NOT internal components.

### 3. Test User Behavior

Use accessible queries that reflect how users interact.

**Bad:** `screen.getByTestId('submit-button');`

**Good:** `screen.getByRole('button', { name: /sign in/i });`

### 4. Include Failure Cases

Every function with error handling needs error path tests.

### 5. Verify State Changes

After actions, assert both state AND rendered output.

### 6. Test File Naming

- Unit tests: `src/__tests__/[path]/[filename].test.ts`
- Integration tests: `src/__tests__/integration/[feature].test.ts`
- E2E tests: `e2e/[flow].spec.ts`

---

## Pre-commit Checklist

Before committing any code:

1. [ ] **code-simplifier agent review completed** (see `docs/AGENT_WORKFLOW.md`)
2. [ ] All tests pass: `npm test`
3. [ ] Coverage is 100%: `npm run test:coverage`
4. [ ] TypeScript compiles: `npm run typecheck`
5. [ ] No console.logs in production code
6. [ ] New features have corresponding tests

---

## CI/CD Integration

> **NOTE**: CI/CD pipeline is implemented via GitHub Actions.
> See `.github/workflows/ci.yml` for configuration.

Tests run automatically on:
- Every push to main/master
- Every pull request to main/master

Pipeline fails if:
- Any test fails
- Coverage drops below threshold
- TypeScript errors exist

---

*Last updated: 2025-01-31*
