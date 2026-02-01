# Cairn Habits App - Comprehensive Test Plan

## Current Status

| Metric | Coverage |
|--------|----------|
| Statements | 100% (154/154) |
| Branches | 100% (62/62) |
| Functions | 100% (42/42) |
| Lines | 100% (150/150) |
| Tests | 136 passing |

*Last updated: 2026-01-31*

## Overview

This document provides a detailed test plan for achieving 100% code coverage of the Cairn habits-app codebase. The plan includes test cases, mock strategies, and priority ordering for all files.

---

## Priority Order for Testing

| Priority | File | Rationale |
|----------|------|-----------|
| P0 | `src/services/google-calendar.ts` | Core business logic, API interactions, error handling |
| P0 | `src/store/auth.ts` | State management, persistence, auth flow |
| P1 | `src/services/google-auth.ts` | OAuth flow, user fetching |
| P1 | `src/config/constants.ts` | Environment configuration, validation |
| P2 | `src/components/Calendar/MonthView.tsx` | Complex date logic, event grouping |
| P2 | `src/components/Calendar/DayCell.tsx` | Conditional rendering, event display |
| P2 | `src/components/Calendar/colors.ts` | Pure utility functions |
| P3 | `src/components/Calendar/CalendarHeader.tsx` | Simple UI component |
| P3 | `src/components/ui/ErrorBoundary.tsx` | Error handling component |
| P3 | `app/_layout.tsx` | Navigation routing logic |
| P3 | `app/index.tsx` | Screen composition, integration |
| P3 | `app/login.tsx` | Screen composition |
| P4 | `src/types/calendar.ts` | Types only - no runtime tests needed |

---

## Mock Strategy

### Google APIs

```typescript
// __mocks__/google-apis.ts
export const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to mock successful API responses
export function mockGoogleApiSuccess<T>(data: T) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

// Helper to mock API errors
export function mockGoogleApiError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: { message } }),
  });
}
```

### Expo Auth Session

```typescript
// __mocks__/expo-auth-session.ts
export const mockPromptAsync = jest.fn();
export const mockResponse = { type: 'success', authentication: null };

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [
    { type: 'request' }, // request object
    mockResponse,        // response object  
    mockPromptAsync,     // promptAsync function
  ],
}));
```

### Expo Constants

```typescript
// __mocks__/expo-constants.ts
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        googleClientId: 'test-client-id',
        googleClientIdIos: 'test-ios-client-id',
        googleClientIdAndroid: 'test-android-client-id',
        expoUsername: 'test-user',
        appSlug: 'test-app',
      },
    },
  },
}));
```

### Zustand Store

```typescript
// __mocks__/auth-store.ts
import { create } from 'zustand';

export const createMockAuthStore = (initialState = {}) => {
  const defaultState = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
  
  return create((set, get) => ({
    ...defaultState,
    ...initialState,
    setAuth: jest.fn((auth) => set({ ...auth, isAuthenticated: true })),
    setLoading: jest.fn((isLoading) => set({ isLoading })),
    logout: jest.fn(() => set(defaultState)),
    isTokenExpired: jest.fn(() => !get().expiresAt || Date.now() >= get().expiresAt),
  }));
};
```

### AsyncStorage

```typescript
// __mocks__/@react-native-async-storage/async-storage.ts
export default {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

### React Native Components (for testing)

```typescript
// Use @testing-library/react-native for component tests
// Mock react-native-safe-area-context, expo-router as needed
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: () => [],
  useRootNavigationState: () => ({ key: 'test-key' }),
  Redirect: () => null,
}));
```

---

## Test File Structure

```
__tests__/
├── setup.ts                          # Jest setup file
├── mocks/
│   ├── google-apis.ts
│   ├── expo-auth-session.ts
│   ├── expo-constants.ts
│   ├── auth-store.ts
│   └── async-storage.ts
├── config/
│   └── constants.test.ts
├── store/
│   └── auth.test.ts
├── services/
│   ├── google-auth.test.ts
│   └── google-calendar.test.ts
├── components/
│   ├── Calendar/
│   │   ├── colors.test.ts
│   │   ├── CalendarHeader.test.tsx
│   │   ├── DayCell.test.tsx
│   │   └── MonthView.test.tsx
│   └── ui/
│       └── ErrorBoundary.test.tsx
└── app/
    ├── _layout.test.tsx
    ├── index.test.tsx
    └── login.test.tsx
```

---

## Detailed Test Cases by File

---

### 1. `src/config/constants.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/config/constants.ts`

#### Functions to Test

| Function | Lines | Description |
|----------|-------|-------------|
| `getEnvVar` | 4-9 | Retrieves environment variables with fallback support |

#### Test Cases (5 total)

```typescript
describe('getEnvVar', () => {
  describe('when value exists in expo config', () => {
    it('should return the value from expoConfig.extra');
  });

  describe('when value is missing', () => {
    it('should return fallback when provided');
    it('should throw Error when no fallback and value missing');
  });

  describe('edge cases', () => {
    it('should handle empty string value (falsy but valid)');
    it('should handle undefined expoConfig');
  });
});

describe('exported constants', () => {
  it('should export GOOGLE_CLIENT_ID');
  it('should export GOOGLE_SCOPES array with correct values');
});
```

#### Edge Cases
- Empty string value in config (should use fallback)
- `expoConfig` is undefined
- `extra` is undefined
- Value is `null` vs `undefined`

#### Mocks Required
- `expo-constants`

#### Estimated Test Cases: 7

---

### 2. `src/store/auth.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/store/auth.ts`

#### Functions to Test

| Function | Lines | Description |
|----------|-------|-------------|
| `setAuth` | 42-51 | Sets authentication state |
| `setLoading` | 53-55 | Sets loading state |
| `logout` | 57-66 | Clears all auth state |
| `isTokenExpired` | 68-71 | Checks token expiration |
| `partialize` | 76-82 | Persists specific state fields |

#### Test Cases (12 total)

```typescript
describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
  });

  describe('initial state', () => {
    it('should have null accessToken');
    it('should have null refreshToken');
    it('should have null expiresAt');
    it('should have null user');
    it('should have isLoading false');
    it('should have isAuthenticated false');
  });

  describe('setAuth', () => {
    it('should set all auth fields');
    it('should set isAuthenticated to true');
    it('should set isLoading to false');
    it('should handle null refreshToken');
    it('should handle null expiresAt');
    it('should handle null user');
  });

  describe('setLoading', () => {
    it('should set isLoading to true');
    it('should set isLoading to false');
  });

  describe('logout', () => {
    it('should reset all fields to initial state');
    it('should set isAuthenticated to false');
  });

  describe('isTokenExpired', () => {
    it('should return true when expiresAt is null');
    it('should return true when current time >= expiresAt');
    it('should return false when current time < expiresAt');
  });

  describe('persistence', () => {
    it('should persist accessToken');
    it('should persist refreshToken');
    it('should persist expiresAt');
    it('should persist user');
    it('should persist isAuthenticated');
    it('should NOT persist isLoading');
  });
});
```

#### Edge Cases
- Token expiration at exact boundary (`Date.now() === expiresAt`)
- Partial user object
- Multiple rapid state updates

#### Mocks Required
- `@react-native-async-storage/async-storage`

#### Estimated Test Cases: 20

---

### 3. `src/services/google-auth.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/services/google-auth.ts`

#### Functions to Test

| Function | Lines | Description |
|----------|-------|-------------|
| `useGoogleAuth` (hook) | 11-59 | Main auth hook |
| `fetchUserInfo` | 61-71 | Fetches user profile from Google API |

#### Test Cases (15 total)

```typescript
describe('useGoogleAuth', () => {
  describe('initialization', () => {
    it('should return isReady false when request is null');
    it('should return isReady true when request exists');
  });

  describe('signIn', () => {
    it('should call setLoading(true) before promptAsync');
    it('should call promptAsync');
    it('should call setLoading(false) on error');
    it('should log error on promptAsync failure');
  });

  describe('signOut', () => {
    it('should call logout from auth store');
  });

  describe('response handling (useEffect)', () => {
    describe('when response.type is success', () => {
      it('should fetch user info with access token');
      it('should call setAuth with auth data and user');
      it('should calculate expiresAt from expiresIn');
      it('should handle null refreshToken');
      it('should handle missing expiresIn');
    });

    describe('when response.type is error', () => {
      it('should log error');
      it('should call setLoading(false)');
    });

    describe('when response.type is other', () => {
      it('should not call setAuth');
    });
  });
});

describe('fetchUserInfo', () => {
  it('should fetch from Google userinfo API');
  it('should include Authorization header');
  it('should return user object on success');
  it('should return null on fetch error');
  it('should return null on JSON parse error');
});
```

#### Edge Cases
- Response with missing authentication object
- Network failure during user info fetch
- Invalid JSON response
- Response type "cancel"

#### Mocks Required
- `expo-auth-session/providers/google`
- `expo-web-browser`
- `fetch` (global)
- `../store/auth` (useAuthStore)

#### Estimated Test Cases: 18

---

### 4. `src/services/google-calendar.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/services/google-calendar.ts`

#### Functions to Test

| Function | Lines | Description |
|----------|-------|-------------|
| `GoogleCalendarError` (class) | 12-21 | Custom error class |
| `AuthExpiredError` (class) | 23-28 | 401 error class |
| `apiRequest` | 30-66 | Generic API request wrapper |
| `wrapError` | 69-75 | Error wrapper utility |
| `getOrCreateCairnCalendar` | 78-113 | Get or create Cairn calendar |
| `listEvents` | 116-139 | List calendar events |
| `createAllDayEvent` | 142-169 | Create all-day event |
| `deleteEvent` | 172-188 | Delete event |

#### Test Cases (35 total)

```typescript
describe('GoogleCalendarError', () => {
  it('should set message');
  it('should set statusCode');
  it('should set details');
  it('should set name to GoogleCalendarError');
});

describe('AuthExpiredError', () => {
  it('should extend GoogleCalendarError');
  it('should have statusCode 401');
  it('should have default message');
  it('should allow custom message');
  it('should set name to AuthExpiredError');
});

describe('apiRequest', () => {
  describe('successful requests', () => {
    it('should make fetch call with correct URL');
    it('should include Authorization header');
    it('should include Content-Type header');
    it('should merge custom headers');
    it('should return parsed JSON response');
  });

  describe('204 No Content responses', () => {
    it('should return undefined for 204 status');
  });

  describe('error responses', () => {
    it('should throw GoogleCalendarError on non-ok response');
    it('should include status code in error');
    it('should include error details from response');
    it('should handle JSON parse failure in error response');
  });

  describe('401 Unauthorized', () => {
    it('should call logout from auth store');
    it('should throw AuthExpiredError');
  });
});

describe('wrapError', () => {
  it('should rethrow GoogleCalendarError unchanged');
  it('should wrap Error in GoogleCalendarError');
  it('should wrap non-Error in GoogleCalendarError');
  it('should include context in message');
});

describe('getOrCreateCairnCalendar', () => {
  describe('when Cairn calendar exists', () => {
    it('should list calendars');
    it('should return existing calendar ID');
    it('should not create new calendar');
  });

  describe('when Cairn calendar does not exist', () => {
    it('should create new calendar');
    it('should set summary to "Cairn"');
    it('should set description');
    it('should return new calendar ID');
  });

  describe('error handling', () => {
    it('should wrap errors with context');
    it('should propagate GoogleCalendarError');
  });
});

describe('listEvents', () => {
  it('should call API with correct endpoint');
  it('should encode calendarId');
  it('should convert dates to ISO format');
  it('should set singleEvents to true');
  it('should order by startTime');
  it('should return items array');
  it('should return empty array when items is undefined');
  it('should wrap errors with context');
});

describe('createAllDayEvent', () => {
  it('should POST to events endpoint');
  it('should encode calendarId');
  it('should set summary');
  it('should set description');
  it('should set date for start and end');
  it('should set colorId');
  it('should return created event');
  it('should wrap errors with context');
});

describe('deleteEvent', () => {
  it('should DELETE to correct endpoint');
  it('should encode calendarId and eventId');
  it('should return void on success');
  it('should wrap errors with context');
});
```

#### Edge Cases
- Empty calendar list
- Calendar with similar name but not exact match "Cairn"
- Invalid date strings
- Special characters in calendarId/eventId requiring encoding
- Network timeout
- Large response pagination (nextPageToken)

#### Mocks Required
- `fetch` (global)
- `../store/auth` (useAuthStore.getState)

#### Estimated Test Cases: 40

---

### 5. `src/types/calendar.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/types/calendar.ts`

**No runtime tests required** - This file contains only TypeScript interfaces/types.

For type safety, consider adding compile-time type tests:

```typescript
// Type tests (compile-time only)
import type { expectType } from 'tsd';
import type { CalendarEvent, EventTime } from './calendar';

// Verify required fields
declare const event: CalendarEvent;
expectType<string>(event.id);
expectType<string>(event.summary);
```

#### Estimated Test Cases: 0 (types only)

---

### 6. `src/components/Calendar/colors.ts`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/components/Calendar/colors.ts`

#### Functions to Test

| Function | Lines | Description |
|----------|-------|-------------|
| `getEventColor` | 19-22 | Maps color ID to hex color |

#### Test Cases (8 total)

```typescript
describe('GOOGLE_CALENDAR_COLORS', () => {
  it('should have 11 color entries');
  it('should have valid hex color format for all values');
});

describe('DEFAULT_EVENT_COLOR', () => {
  it('should be #4F46E5');
});

describe('getEventColor', () => {
  it('should return color for valid colorId "1"');
  it('should return color for valid colorId "11"');
  it('should return DEFAULT_EVENT_COLOR for undefined');
  it('should return DEFAULT_EVENT_COLOR for null');
  it('should return DEFAULT_EVENT_COLOR for empty string');
  it('should return DEFAULT_EVENT_COLOR for invalid colorId');
  it('should return DEFAULT_EVENT_COLOR for colorId "0"');
  it('should return DEFAULT_EVENT_COLOR for colorId "12"');
});
```

#### Edge Cases
- Numeric colorId vs string colorId ("1" vs 1)
- Out of range colorId ("0", "12", "100")
- Non-numeric string colorId ("abc")

#### Mocks Required
- None (pure function)

#### Estimated Test Cases: 10

---

### 7. `src/components/Calendar/CalendarHeader.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/components/Calendar/CalendarHeader.tsx`

#### Functions to Test

| Component | Lines | Description |
|-----------|-------|-------------|
| `CalendarHeader` | 11-27 | Month navigation header |

#### Test Cases (6 total)

```typescript
describe('CalendarHeader', () => {
  describe('rendering', () => {
    it('should render month and year');
    it('should format date as "MMMM yyyy" (e.g., "January 2024")');
  });

  describe('navigation', () => {
    it('should call onPrevMonth when left button pressed');
    it('should call onNextMonth when right button pressed');
  });

  describe('memoization', () => {
    it('should not re-render when props unchanged');
    it('should re-render when currentDate changes');
  });
});
```

#### Edge Cases
- Year boundaries (December -> January)
- Different locales (if applicable)

#### Mocks Required
- `date-fns` (optional - can use real implementation)

#### Estimated Test Cases: 6

---

### 8. `src/components/Calendar/DayCell.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/components/Calendar/DayCell.tsx`

#### Functions to Test

| Component | Lines | Description |
|-----------|-------|-------------|
| `DayCell` | 13-41 | Individual day cell in calendar grid |

#### Test Cases (12 total)

```typescript
describe('DayCell', () => {
  describe('rendering', () => {
    it('should render day number');
    it('should apply current month styles when isCurrentMonth true');
    it('should apply other month styles when isCurrentMonth false');
    it('should apply today styles when isToday true');
  });

  describe('event dots', () => {
    it('should render no dots when eventColors is empty');
    it('should render 1 dot for 1 event');
    it('should render 3 dots for 3 events');
    it('should render 3 dots + "+" for 4 events');
    it('should render 3 dots + "+" for 10 events');
    it('should apply correct color to each dot');
  });

  describe('interaction', () => {
    it('should call onPress when pressed');
    it('should not crash when onPress is undefined');
  });
});
```

#### Edge Cases
- Empty eventColors array
- eventColors with empty strings (should use default color)
- Very large number of events
- Combined states (isToday && !isCurrentMonth)

#### Mocks Required
- `./colors` (getEventColor)

#### Estimated Test Cases: 12

---

### 9. `src/components/Calendar/MonthView.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/components/Calendar/MonthView.tsx`

#### Functions to Test

| Function/Component | Lines | Description |
|-------------------|-------|-------------|
| `getEventDate` | 28-37 | Extracts date from event |
| `MonthView` | 39-124 | Full month calendar view |

#### Test Cases (22 total)

```typescript
describe('getEventDate', () => {
  it('should return date for all-day event');
  it('should extract date from dateTime for timed event');
  it('should return null when no date or dateTime');
});

describe('MonthView', () => {
  describe('rendering', () => {
    it('should render CalendarHeader');
    it('should render weekday headers (Mon-Sun)');
    it('should render correct number of day cells');
    it('should include padding days from previous month');
    it('should include padding days from next month');
  });

  describe('eventsByDate computation', () => {
    it('should group events by date');
    it('should collect colorIds for each date');
    it('should handle events without colorId');
    it('should handle empty events array');
  });

  describe('calendarDays computation', () => {
    it('should start week on Monday');
    it('should include full weeks');
    it('should handle month starting on Monday');
    it('should handle month starting on Sunday');
  });

  describe('month navigation', () => {
    it('should update currentDate on prev month');
    it('should update currentDate on next month');
    it('should call onMonthChange with year and month');
  });

  describe('day press', () => {
    it('should call onDayPress with formatted date string');
    it('should format as yyyy-MM-dd');
  });

  describe('today highlighting', () => {
    it('should mark current day as today');
    it('should not mark other days as today');
  });
});
```

#### Edge Cases
- February in leap year
- Month with 6 weeks of days
- Events spanning midnight
- Timezone considerations
- Year boundary navigation

#### Mocks Required
- `date-fns` (optional)
- `./CalendarHeader`
- `./DayCell`

#### Estimated Test Cases: 22

---

### 10. `src/components/ui/ErrorBoundary.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/src/components/ui/ErrorBoundary.tsx`

#### Functions to Test

| Method | Lines | Description |
|--------|-------|-------------|
| `getDerivedStateFromError` | 18-20 | Static error handler |
| `componentDidCatch` | 22-25 | Error logging |
| `handleRetry` | 27-29 | Reset error state |
| `render` | 31-51 | Render logic |

#### Test Cases (10 total)

```typescript
describe('ErrorBoundary', () => {
  describe('when no error', () => {
    it('should render children');
    it('should not render error UI');
  });

  describe('when error occurs', () => {
    it('should catch error from child component');
    it('should set hasError to true');
    it('should store error object');
    it('should log error with console.error');
  });

  describe('error UI', () => {
    it('should render default error message');
    it('should display error.message when available');
    it('should render custom fallback when provided');
  });

  describe('retry functionality', () => {
    it('should reset hasError on retry press');
    it('should clear error on retry press');
    it('should render children after retry');
  });
});
```

#### Edge Cases
- Error without message
- Nested ErrorBoundary
- Error during retry render
- Custom fallback component

#### Mocks Required
- `console.error` (spy)

#### Estimated Test Cases: 12

---

### 11. `app/_layout.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/app/_layout.tsx`

#### Functions to Test

| Component | Lines | Description |
|-----------|-------|-------------|
| `RootLayoutNav` | 7-49 | Navigation with auth routing |
| `RootLayout` | 51-57 | Root layout wrapper |

#### Test Cases (10 total)

```typescript
describe('RootLayoutNav', () => {
  describe('navigation readiness', () => {
    it('should not navigate until navigation is ready');
    it('should set isNavigationReady when navigationState.key exists');
  });

  describe('auth routing', () => {
    describe('when not authenticated', () => {
      it('should redirect to /login when not in auth group');
      it('should not redirect when already in auth group');
    });

    describe('when authenticated', () => {
      it('should redirect to / when in auth group');
      it('should not redirect when not in auth group');
    });
  });

  describe('rendering', () => {
    it('should render StatusBar');
    it('should render Stack with correct screen options');
  });
});

describe('RootLayout', () => {
  it('should wrap content in ErrorBoundary');
  it('should render RootLayoutNav inside ErrorBoundary');
});
```

#### Edge Cases
- Navigation state key is null/undefined
- Rapid auth state changes
- Deep linking scenarios

#### Mocks Required
- `expo-router` (Stack, useRouter, useSegments, useRootNavigationState)
- `../src/store/auth` (useAuthStore)
- `../src/components/ui/ErrorBoundary`

#### Estimated Test Cases: 10

---

### 12. `app/index.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/app/index.tsx`

#### Functions to Test

| Component | Lines | Description |
|-----------|-------|-------------|
| `HomeScreen` | 11-146 | Main home screen |

#### Test Cases (18 total)

```typescript
describe('HomeScreen', () => {
  describe('rendering', () => {
    it('should render user avatar when picture exists');
    it('should not render avatar when picture is null');
    it('should render greeting with first name');
    it('should render "there" when name is null');
    it('should render formatted date');
  });

  describe('calendar initialization', () => {
    it('should call getOrCreateCairnCalendar on mount');
    it('should call listEvents after calendar is created');
    it('should set loading state during init');
    it('should clear loading after init complete');
    it('should not init when accessToken is null');
  });

  describe('error handling', () => {
    it('should display error message on init failure');
    it('should show retry button on error');
    it('should retry loading on retry press');
  });

  describe('month change', () => {
    it('should fetch events for new month');
    it('should handle month change error');
    it('should not fetch when calendarId is null');
  });

  describe('day press', () => {
    it('should log pressed date');
  });

  describe('loading state', () => {
    it('should show ActivityIndicator while loading');
  });
});
```

#### Edge Cases
- User with very long name
- Network failure during calendar init
- Token expiration during month change
- Empty events response

#### Mocks Required
- `../src/store/auth` (useAuthStore)
- `../src/services/google-auth` (useGoogleAuth)
- `../src/services/google-calendar`
- `expo-router` (Stack)

#### Estimated Test Cases: 18

---

### 13. `app/login.tsx`

**Location:** `/Users/manuel.canedo/Dev/personal/habits-app/app/login.tsx`

#### Functions to Test

| Component | Lines | Description |
|-----------|-------|-------------|
| `LoginScreen` | 6-59 | Login screen |

#### Test Cases (10 total)

```typescript
describe('LoginScreen', () => {
  describe('redirect', () => {
    it('should redirect to / when already authenticated');
  });

  describe('rendering', () => {
    it('should render logo');
    it('should render title "Cairn"');
    it('should render subtitle');
    it('should render Google sign-in button');
    it('should render disclaimer text');
  });

  describe('button state', () => {
    it('should disable button when not ready');
    it('should disable button when loading');
    it('should enable button when ready and not loading');
    it('should show "Signing in..." when loading');
    it('should show "Continue with Google" when not loading');
  });

  describe('sign in', () => {
    it('should call signIn on button press');
  });
});
```

#### Edge Cases
- Race condition between redirect and render
- Button disabled styling

#### Mocks Required
- `../src/services/google-auth` (useGoogleAuth)
- `../src/store/auth` (useAuthStore)
- `expo-router` (Stack, Redirect)

#### Estimated Test Cases: 12

---

## Summary

### Total Test Cases by File

| File | Test Cases |
|------|------------|
| `src/config/constants.ts` | 7 |
| `src/store/auth.ts` | 20 |
| `src/services/google-auth.ts` | 18 |
| `src/services/google-calendar.ts` | 40 |
| `src/types/calendar.ts` | 0 |
| `src/components/Calendar/colors.ts` | 10 |
| `src/components/Calendar/CalendarHeader.tsx` | 6 |
| `src/components/Calendar/DayCell.tsx` | 12 |
| `src/components/Calendar/MonthView.tsx` | 22 |
| `src/components/ui/ErrorBoundary.tsx` | 12 |
| `app/_layout.tsx` | 10 |
| `app/index.tsx` | 18 |
| `app/login.tsx` | 12 |
| **TOTAL** | **187** |

### Test Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.x",
    "@testing-library/jest-native": "^5.x",
    "jest": "^29.x",
    "jest-expo": "^50.x",
    "react-test-renderer": "^18.x"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|expo-.*|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|zustand)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

---

## Implementation Order Recommendation

1. **Phase 1 - Core Services (P0)**
   - `google-calendar.test.ts` (40 tests)
   - `auth.test.ts` (20 tests)

2. **Phase 2 - Auth & Config (P1)**
   - `google-auth.test.ts` (18 tests)
   - `constants.test.ts` (7 tests)

3. **Phase 3 - Calendar Components (P2)**
   - `colors.test.ts` (10 tests)
   - `MonthView.test.tsx` (22 tests)
   - `DayCell.test.tsx` (12 tests)

4. **Phase 4 - UI Components (P3)**
   - `CalendarHeader.test.tsx` (6 tests)
   - `ErrorBoundary.test.tsx` (12 tests)
   - `_layout.test.tsx` (10 tests)
   - `index.test.tsx` (18 tests)
   - `login.test.tsx` (12 tests)

---

*Generated: 2026-01-31*
*Total Estimated Tests: 187*
