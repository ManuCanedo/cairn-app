# Cairn MVP Architecture Plan

> Comprehensive scalability assessment and roadmap for production launch

**Date:** 2026-01-31
**Status:** DRAFT
**Author:** Architecture Review

---

> **⚠️ DOCUMENT STATUS**: Point-in-time architecture review from 2026-01-31.
> Many P0 issues have been resolved. Re-review needed before using as implementation guide.
>
> | Issue                      | Status                                         |
> | -------------------------- | ---------------------------------------------- |
> | P0.1 Token refresh         | **RESOLVED** - platform-aware refresh (PR #31) |
> | P0.2 Hardcoded credentials | **RESOLVED** - removed fallback                |
> | P0.3 No ErrorBoundary      | **RESOLVED**                                   |
> | P0.4 401 error handling    | **RESOLVED**                                   |
> | P2.7 Dead code files       | **RESOLVED** - files removed                   |

---

## Executive Summary

The Cairn codebase demonstrates solid foundational patterns for an early-stage React Native/Expo application. The Google Calendar-as-backend approach is innovative and reduces infrastructure complexity. However, several critical gaps must be addressed before MVP launch: **token refresh handling, environment configuration, error boundaries, and offline resilience**. The codebase is well-structured but needs hardening for production traffic and edge cases.

---

## Table of Contents

1. [Current Architecture Assessment](#current-architecture-assessment)
2. [Critical Issues (P0)](#critical-issues-p0---must-fix-before-mvp)
3. [High Priority (P1)](#high-priority-p1---should-fix-for-mvp)
4. [Medium Priority (P2)](#medium-priority-p2---post-mvp-improvements)
5. [Recommended Directory Structure](#recommended-directory-structure)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Specifications](#technical-specifications)

---

## Current Architecture Assessment

### Strengths

| Area                    | Implementation                           | Assessment                                                     |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| **State Management**    | Zustand with persist middleware          | Excellent choice. Lightweight, TypeScript-native, simple API   |
| **Authentication Flow** | expo-auth-session + Google OAuth         | Correct approach for Expo managed workflow                     |
| **API Layer**           | Centralized `apiRequest<T>` helper       | Good pattern. Single point for auth headers and error handling |
| **Component Structure** | Feature-based organization (Calendar/\*) | Clean separation, barrel exports                               |
| **Type Safety**         | TypeScript with strict mode              | Proper typing for API responses and component props            |
| **Date Handling**       | date-fns                                 | Lightweight, tree-shakeable, immutable                         |

### Weaknesses

| Area                   | Issue                               | Risk Level                                             |
| ---------------------- | ----------------------------------- | ------------------------------------------------------ |
| **Token Management**   | No refresh token implementation     | **CRITICAL** - Users will be logged out after 1 hour   |
| **Environment Config** | Hardcoded client ID in source       | **CRITICAL** - Security risk, blocks multi-env deploys |
| **Error Handling**     | No global error boundary            | **HIGH** - Crashes show white screen                   |
| **Offline Support**    | None implemented                    | **HIGH** - App unusable without network                |
| **Loading States**     | Inconsistent, some missing          | **MEDIUM** - Poor UX                                   |
| **Dead Code**          | `HabitItem.tsx`, `habits.ts` unused | **LOW** - Confusing for maintainers                    |

### Architecture Diagram (Current)

```
+------------------+     +-------------------+     +------------------+
|   expo-router    | --> |   Zustand Store   | --> |   AsyncStorage   |
|   (app/*.tsx)    |     |   (auth, habits)  |     |   (persistence)  |
+------------------+     +-------------------+     +------------------+
        |
        v
+------------------+     +-------------------+
|   Components     | --> | Google Calendar   |
|   (Calendar/*)   |     | API (services/)   |
+------------------+     +-------------------+
```

---

## Critical Issues (P0) - Must Fix Before MVP

### P0.1: Token Refresh Implementation

**Problem:** OAuth access tokens expire after ~1 hour. Current implementation has no refresh mechanism.

**Evidence:**

- `/Users/manuel.canedo/Dev/personal/habits-app/src/store/auth.ts:67-71` - `isTokenExpired()` exists but is never called
- `/Users/manuel.canedo/Dev/personal/habits-app/src/services/google-auth.ts` - No refresh logic
- Token expiry stored but never checked before API calls

**Impact:** Users silently fail API calls after 1 hour, or get logged out.

**Solution:**

```typescript
// src/services/token-manager.ts
export async function getValidAccessToken(): Promise<string> {
  const { accessToken, expiresAt, refreshToken } = useAuthStore.getState();

  // Buffer of 5 minutes before expiry
  if (expiresAt && Date.now() > expiresAt - 300000) {
    if (refreshToken) {
      return await refreshAccessToken(refreshToken);
    }
    // Force re-auth if no refresh token
    useAuthStore.getState().logout();
    throw new AuthExpiredError();
  }

  return accessToken;
}
```

**Acceptance Criteria:**

- [ ] Token validity checked before every API call
- [ ] Refresh token used automatically when access token expires
- [ ] User redirected to login only when refresh fails
- [ ] No silent API failures due to expired tokens

---

### P0.2: Environment Configuration

**Problem:** Google Client ID hardcoded in source code.

**Evidence:**

- `/Users/manuel.canedo/Dev/personal/habits-app/src/config/constants.ts:3` - Client ID in plain text

**Impact:**

- Cannot deploy to different environments (dev/staging/prod)
- Security risk if repo becomes public
- App Store review may flag hardcoded credentials

**Solution:**

```typescript
// src/config/constants.ts
import Constants from 'expo-constants';

const getEnvVar = (key: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const GOOGLE_CLIENT_ID = getEnvVar('googleClientId');
export const GOOGLE_CLIENT_ID_IOS = getEnvVar('googleClientIdIos');
export const GOOGLE_CLIENT_ID_ANDROID = getEnvVar('googleClientIdAndroid');
```

```javascript
// app.config.js (replace app.json)
export default {
  expo: {
    // ... existing config
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS,
      googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID,
    },
  },
};
```

**Acceptance Criteria:**

- [ ] All secrets loaded from environment variables
- [ ] App fails fast with clear error if env vars missing
- [ ] `.env.example` documents all required variables
- [ ] No secrets in git history (may need history rewrite)

---

### P0.3: Global Error Boundary

**Problem:** Unhandled errors crash the app with a white screen.

**Evidence:**

- No ErrorBoundary component in `/Users/manuel.canedo/Dev/personal/habits-app/app/_layout.tsx`
- API errors only logged to console

**Impact:** Users see blank screen on crash, no way to recover.

**Solution:**

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Send to error reporting service (Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <Pressable onPress={this.handleRetry}>
            <Text>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
```

**Acceptance Criteria:**

- [ ] ErrorBoundary wraps the app in \_layout.tsx
- [ ] Users see friendly error screen, not white screen
- [ ] Retry button allows recovery without app restart
- [ ] Errors logged for debugging

---

### P0.4: API Error Handling for 401 Responses

**Problem:** 401 errors from Google API are not handled gracefully.

**Evidence:**

- `/Users/manuel.canedo/Dev/personal/habits-app/src/services/google-calendar.ts:36-43` - Generic error handling, no 401 special case

**Impact:** Expired tokens cause confusing error messages instead of re-auth flow.

**Solution:**

```typescript
// In apiRequest function
if (response.status === 401) {
  // Token invalid/expired
  useAuthStore.getState().logout();
  throw new AuthExpiredError('Session expired. Please sign in again.');
}
```

**Acceptance Criteria:**

- [ ] 401 responses trigger logout and redirect to login
- [ ] User sees clear message about session expiry
- [ ] Other API errors show appropriate messages

---

## High Priority (P1) - Should Fix for MVP

### P1.1: Offline Support / Data Caching

**Problem:** App is unusable without network connectivity.

**Current State:** Every month change triggers a fresh API call.

**Solution:**

```typescript
// src/store/calendar-cache.ts
interface CalendarCache {
  events: Map<string, CalendarEvent[]>; // key: "YYYY-MM"
  lastFetched: Map<string, number>;
  calendarId: string | null;

  getCachedEvents: (yearMonth: string) => CalendarEvent[] | null;
  setCachedEvents: (yearMonth: string, events: CalendarEvent[]) => void;
  isCacheValid: (yearMonth: string, maxAgeMs?: number) => boolean;
}
```

**Caching Strategy:**

1. Cache events by month (key: `YYYY-MM`)
2. Cache `calendarId` to avoid lookup on every session
3. Stale-while-revalidate: show cached data immediately, refresh in background
4. Cache invalidation: 5 minutes for current month, 1 hour for past months

**Acceptance Criteria:**

- [ ] Previously viewed months load instantly from cache
- [ ] CalendarId persisted, not re-fetched every session
- [ ] Offline indicator shown when network unavailable
- [ ] Optimistic updates when creating events

---

### P1.2: Centralized API Client with Interceptors

**Problem:** Each API call handles auth headers independently; no central retry logic.

**Solution:**

```typescript
// src/services/api-client.ts
class ApiClient {
  private baseUrl: string;

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getValidAccessToken(); // P0.1

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Handle token expiry
    }

    if (response.status === 429) {
      // Rate limiting - exponential backoff
    }

    // ... error handling
  }
}

export const calendarApi = new ApiClient('https://www.googleapis.com/calendar/v3');
```

**Acceptance Criteria:**

- [ ] Single ApiClient class handles all HTTP concerns
- [ ] Automatic token refresh before requests
- [ ] Rate limit handling with exponential backoff
- [ ] Request/response logging in development

---

### P1.3: Loading State Management

**Problem:** Inconsistent loading states across the app.

**Evidence:**

- `/Users/manuel.canedo/Dev/personal/habits-app/app/index.tsx:113-117` - Loading overlay positioned absolutely
- No skeleton screens
- Loading state is local to component

**Solution:** Create a unified loading state pattern:

```typescript
// src/hooks/useAsyncState.ts
interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAsyncState<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  // Implementation with proper cleanup, error handling, and caching
}
```

**Acceptance Criteria:**

- [ ] Consistent loading indicators across all screens
- [ ] Skeleton screens for calendar and lists
- [ ] Pull-to-refresh functionality
- [ ] Error states with retry actions

---

### P1.4: Input Validation and Sanitization

**Problem:** No validation on user inputs for activity templates (Task 005).

**Solution:**

```typescript
// src/utils/validation.ts
export const activityTemplateSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[\w\s\p{Emoji}]+$/u,
  },
  emoji: {
    required: true,
    pattern: /^\p{Emoji}$/u,
  },
  colorId: {
    required: true,
    oneOf: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  },
};
```

**Acceptance Criteria:**

- [ ] All user inputs validated before storage
- [ ] Clear error messages for invalid inputs
- [ ] XSS prevention (though React handles most)
- [ ] Maximum limits on stored data (e.g., 50 templates max)

---

### P1.5: Platform-Specific OAuth Configuration

**Problem:** Single client ID used for all platforms; iOS/Android need platform-specific credentials.

**Evidence:**

- `/Users/manuel.canedo/Dev/personal/habits-app/src/services/google-auth.ts:13-16` - Only `clientId` used

**Solution:**

```typescript
// src/services/google-auth.ts
import { Platform } from 'react-native';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_ID_IOS,
  GOOGLE_CLIENT_ID_ANDROID,
} from '../config/constants';

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: GOOGLE_CLIENT_ID, // Web
  iosClientId: GOOGLE_CLIENT_ID_IOS,
  androidClientId: GOOGLE_CLIENT_ID_ANDROID,
  scopes: GOOGLE_SCOPES,
});
```

**Acceptance Criteria:**

- [ ] Separate OAuth credentials per platform
- [ ] Google Cloud Console configured with all redirect URIs
- [ ] OAuth works on iOS simulator
- [ ] OAuth works on Android emulator

---

## Medium Priority (P2) - Post-MVP Improvements

### P2.1: Testing Infrastructure

**Current State:** No tests exist.

**Recommended Stack:**

- **Unit Tests:** Jest + React Native Testing Library
- **Component Tests:** Storybook (optional but helpful)
- **E2E Tests:** Maestro or Detox (after MVP)

**Priority Test Coverage:**

1. Token refresh logic (P0.1)
2. Calendar date calculations
3. API error handling
4. Zustand store actions

```json
// package.json additions
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "jest-expo": "~54.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

### P2.2: Error Monitoring (Sentry)

**Rationale:** Cannot debug production issues without error tracking.

```typescript
// src/services/error-reporting.ts
import * as Sentry from '@sentry/react-native';

export function initErrorReporting() {
  if (__DEV__) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2,
  });
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}
```

---

### P2.3: Analytics

**Recommended Events:**

- `auth_success` / `auth_failure`
- `calendar_month_viewed`
- `activity_logged`
- `template_created` / `template_deleted`
- `app_error`

**Options:** Amplitude, Mixpanel, or PostHog (privacy-focused).

---

### P2.4: Performance Optimization

**Current Concerns:**

1. Calendar re-renders on every event change (memoization needed)
2. Event grouping computed on every render
3. No virtualization for long lists

**Solutions:**

```typescript
// Memoize expensive computations
const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

// Memoize child components
const MemoizedDayCell = memo(DayCell);

// Use callbacks to prevent child re-renders
const handleDayPress = useCallback((date: string) => {
  // ...
}, []);
```

---

### P2.5: Accessibility (a11y)

**Current Gaps:**

- No `accessibilityLabel` on interactive elements
- Calendar navigation not keyboard accessible
- Color-only indicators (dots) may be unclear to colorblind users

**Fixes:**

```typescript
<Pressable
  onPress={handlePrevMonth}
  accessibilityLabel="Go to previous month"
  accessibilityRole="button"
>
  <Text>{'<'}</Text>
</Pressable>
```

---

### P2.6: CI/CD Pipeline

**Recommended Setup (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test

  build-preview:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile preview --non-interactive
```

---

### P2.7: Clean Up Dead Code

**Files to Remove or Integrate:**

- `/Users/manuel.canedo/Dev/personal/habits-app/src/components/HabitItem.tsx` - Unused, references old habits pattern
- `/Users/manuel.canedo/Dev/personal/habits-app/src/store/habits.ts` - Unused, superseded by Calendar approach
- `/Users/manuel.canedo/Dev/personal/habits-app/src/types/habit.ts` - Unused type definitions

**Decision:** Either integrate into Task 005 (Activity Templates) or remove to reduce confusion.

---

## Recommended Directory Structure

```
cairn/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + auth guard
│   ├── index.tsx                 # Home (calendar view)
│   ├── login.tsx                 # Login screen
│   └── activities/
│       ├── index.tsx             # List templates
│       └── [id].tsx              # Edit template (dynamic route)
│
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── Calendar/             # Calendar feature (existing)
│   │   │   ├── MonthView.tsx
│   │   │   ├── DayCell.tsx
│   │   │   ├── CalendarHeader.tsx
│   │   │   ├── colors.ts
│   │   │   └── index.ts
│   │   └── ActivityPicker/       # Activity selection (Task 006)
│   │       ├── ActivityPicker.tsx
│   │       ├── ActivityItem.tsx
│   │       └── index.ts
│   │
│   ├── services/
│   │   ├── api-client.ts         # NEW: Centralized HTTP client
│   │   ├── token-manager.ts      # NEW: Token refresh logic
│   │   ├── google-auth.ts        # Existing (refactored)
│   │   ├── google-calendar.ts    # Existing (use api-client)
│   │   └── error-reporting.ts    # NEW: Sentry integration
│   │
│   ├── store/
│   │   ├── auth.ts               # Existing
│   │   ├── activities.ts         # NEW: Activity templates (Task 005)
│   │   └── calendar-cache.ts     # NEW: Event caching (P1.1)
│   │
│   ├── hooks/
│   │   ├── useAsyncState.ts      # NEW: Generic async data hook
│   │   ├── useCalendarEvents.ts  # NEW: Events with caching
│   │   └── useNetworkStatus.ts   # NEW: Offline detection
│   │
│   ├── utils/
│   │   ├── validation.ts         # NEW: Input validation
│   │   ├── date.ts               # Date formatting helpers
│   │   └── constants.ts          # Non-sensitive constants
│   │
│   ├── types/
│   │   ├── calendar.ts           # Existing
│   │   ├── activity.ts           # NEW: Activity template types
│   │   └── api.ts                # NEW: API response types
│   │
│   └── config/
│       └── env.ts                # Environment variable loader
│
├── assets/                       # Images, fonts
├── docs/                         # Documentation
│
├── app.config.js                 # Dynamic Expo config (replaces app.json)
├── babel.config.js               # Existing
├── metro.config.js               # Existing
├── tsconfig.json                 # Existing
├── .env.example                  # Document required env vars
└── package.json
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Task                               | Priority | Effort | Owner |
| ---------------------------------- | -------- | ------ | ----- |
| P0.2: Environment configuration    | P0       | 2h     | -     |
| P0.1: Token refresh implementation | P0       | 4h     | -     |
| P0.3: Global error boundary        | P0       | 2h     | -     |
| P0.4: 401 error handling           | P0       | 1h     | -     |

### Phase 2: Complete Features (Week 2)

| Task                                 | Priority | Effort | Owner |
| ------------------------------------ | -------- | ------ | ----- |
| Task 005: Activity Templates CRUD    | Feature  | 6h     | -     |
| Task 006: Activity Registration Flow | Feature  | 4h     | -     |
| P1.5: Platform OAuth config          | P1       | 2h     | -     |

### Phase 3: Hardening (Week 3)

| Task                            | Priority | Effort | Owner |
| ------------------------------- | -------- | ------ | ----- |
| P1.1: Offline support / caching | P1       | 6h     | -     |
| P1.2: Centralized API client    | P1       | 3h     | -     |
| P1.3: Loading state consistency | P1       | 3h     | -     |
| Task 007: Integration & Polish  | Feature  | 4h     | -     |

### Phase 4: Production Prep (Week 4)

| Task                            | Priority | Effort | Owner |
| ------------------------------- | -------- | ------ | ----- |
| P2.1: Testing infrastructure    | P2       | 6h     | -     |
| P2.2: Error monitoring (Sentry) | P2       | 2h     | -     |
| P2.6: CI/CD pipeline            | P2       | 4h     | -     |
| P2.7: Clean up dead code        | P2       | 1h     | -     |

---

## Technical Specifications

### Token Refresh Flow

```
┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
         v
┌─────────────────┐     No      ┌─────────────────┐
│ Token expires   │ ──────────> │ Make API call   │
│ in < 5 min?     │             │ with token      │
└────────┬────────┘             └─────────────────┘
         │ Yes
         v
┌─────────────────┐
│ Has refresh     │     No      ┌─────────────────┐
│ token?          │ ──────────> │ Redirect to     │
└────────┬────────┘             │ login           │
         │ Yes                  └─────────────────┘
         v
┌─────────────────┐
│ Call Google     │
│ token endpoint  │
└────────┬────────┘
         │
         v
┌─────────────────┐     Fail    ┌─────────────────┐
│ Success?        │ ──────────> │ Clear auth,     │
└────────┬────────┘             │ redirect login  │
         │ Yes                  └─────────────────┘
         v
┌─────────────────┐
│ Update store,   │
│ retry request   │
└─────────────────┘
```

### Caching Strategy

| Data Type            | Cache Duration | Storage      | Invalidation     |
| -------------------- | -------------- | ------------ | ---------------- |
| CalendarId           | Forever        | AsyncStorage | Manual only      |
| Current month events | 5 minutes      | Memory       | On create/delete |
| Past month events    | 1 hour         | Memory       | On app restart   |
| Activity templates   | Forever        | AsyncStorage | On CRUD          |

### Error Classification

| Error Type       | User Message                  | Action                           |
| ---------------- | ----------------------------- | -------------------------------- |
| Network timeout  | "Connection timed out"        | Retry button                     |
| 401 Unauthorized | "Session expired"             | Redirect to login                |
| 403 Forbidden    | "Access denied"               | Show calendar permissions needed |
| 404 Not Found    | "Calendar not found"          | Re-create Cairn calendar         |
| 429 Rate Limited | "Too many requests"           | Auto-retry with backoff          |
| 5xx Server Error | "Google Calendar unavailable" | Retry in 30s                     |

---

## Security Considerations

1. **Credentials:** Never commit OAuth credentials. Use environment variables.
2. **Token Storage:** AsyncStorage is not encrypted. Consider expo-secure-store for tokens.
3. **Data Privacy:** All user data stays in their Google Calendar. No server-side storage.
4. **HTTPS Only:** All API calls use HTTPS (enforced by Google).
5. **Scope Minimization:** Only request necessary Calendar scopes.

---

## Monitoring Checklist for MVP Launch

- [ ] Sentry error reporting configured
- [ ] Basic analytics events firing
- [ ] Crash-free rate baseline established
- [ ] API latency monitoring (optional: Google Cloud Monitoring)
- [ ] User feedback channel (in-app or email)

---

## Open Questions

1. **Multi-device sync:** Should activity templates sync via Google Calendar metadata or remain device-local?
2. **Rate limits:** Google Calendar API has quotas. Do we need request throttling for heavy users?
3. **Dark mode:** User setting or system preference? When to implement?
4. **Localization:** Is i18n needed for MVP? Which languages?

---

## Appendix: File Reference

| File                              | Purpose                   | Status                |
| --------------------------------- | ------------------------- | --------------------- |
| `app/_layout.tsx`                 | Root layout, auth guard   | Needs ErrorBoundary   |
| `app/index.tsx`                   | Home screen with calendar | Working               |
| `app/login.tsx`                   | Google OAuth login        | Working               |
| `src/store/auth.ts`               | Auth state + persistence  | Needs token refresh   |
| `src/services/google-auth.ts`     | OAuth flow                | Needs platform IDs    |
| `src/services/google-calendar.ts` | Calendar API              | Needs 401 handling    |
| `src/components/Calendar/*`       | Calendar UI               | Working               |
| `src/config/constants.ts`         | Config values             | **Hardcoded secrets** |

---

_Last updated: 2026-01-31_
