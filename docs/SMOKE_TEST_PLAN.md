# Cairn Habits App - Browser Smoke Test Plan

## Overview

This document defines the smoke test plan for browser-based testing of the Cairn habits app. These tests are executed manually or via Chrome automation to verify the app works correctly in a real browser environment.

**Last executed:** Never
**Last updated:** 2026-01-31
**App URL:** http://localhost:8081

---

## Prerequisites

Before running smoke tests:
1. Start the Expo development server: `npm start -- --web`
2. Ensure you have valid Google OAuth credentials configured
3. Clear browser cache/cookies for a clean test (optional)

---

## Test Execution Status

| Test ID | Test Name | Status | Last Run | Notes |
|---------|-----------|--------|----------|-------|
| ST-001 | App loads successfully | ⬜ Not run | - | - |
| ST-002 | Login page displays correctly | ⬜ Not run | - | - |
| ST-003 | Google OAuth flow works | ⬜ Not run | - | - |
| ST-004 | Calendar displays after login | ⬜ Not run | - | - |
| ST-005 | Calendar navigation works | ⬜ Not run | - | - |
| ST-006 | Sign out works | ⬜ Not run | - | - |
| ST-007 | Session persistence works | ⬜ Not run | - | - |
| ST-008 | Error boundary catches errors | ⬜ Not run | - | - |
| ST-009 | 401 error triggers logout | ⬜ Not run | - | - |
| ST-010 | Calendar events display | ⬜ Not run | - | - |

**Legend:** ✅ Passed | ❌ Failed | ⬜ Not run | ⏭️ Skipped

---

## Test Cases

### ST-001: App Loads Successfully

**Priority:** P0
**Category:** Startup

**Steps:**
1. Navigate to http://localhost:8081
2. Wait for app to load

**Expected Results:**
- [ ] Page loads without errors
- [ ] No console errors related to app code
- [ ] Either login page or home page displays (depending on auth state)

**Automation Commands:**
```
navigate to http://localhost:8081
wait 3 seconds
take screenshot
check: no "Something went wrong" text visible
```

---

### ST-002: Login Page Displays Correctly

**Priority:** P0
**Category:** Authentication UI

**Preconditions:** User is not authenticated (clear localStorage)

**Steps:**
1. Navigate to http://localhost:8081
2. Verify login page elements

**Expected Results:**
- [ ] Logo "🪨" is visible
- [ ] Title "Cairn" is visible
- [ ] Subtitle "Stack your habits, mark your journey" is visible
- [ ] "Continue with Google" button is visible
- [ ] Disclaimer text about Google Calendar is visible

**Automation Commands:**
```
navigate to http://localhost:8081
wait for text "Cairn"
check: text "Continue with Google" is visible
check: text "Stack your habits" is visible
take screenshot
```

---

### ST-003: Google OAuth Flow Works

**Priority:** P0
**Category:** Authentication

**Preconditions:** User is not authenticated

**Steps:**
1. Navigate to login page
2. Click "Continue with Google" button
3. Complete Google OAuth in popup/redirect
4. Verify redirect back to app

**Expected Results:**
- [ ] Clicking button opens Google OAuth
- [ ] After auth, user is redirected to home page
- [ ] User's name/avatar appears in header area
- [ ] Calendar loads

**Automation Commands:**
```
navigate to http://localhost:8081
click "Continue with Google"
wait 5 seconds
# Manual: Complete Google OAuth
wait for text "Hello"
take screenshot
```

**Note:** OAuth popup may require manual interaction.

---

### ST-004: Calendar Displays After Login

**Priority:** P0
**Category:** Calendar

**Preconditions:** User is authenticated

**Steps:**
1. Navigate to home page (authenticated)
2. Verify calendar components

**Expected Results:**
- [ ] User greeting "Hello, [Name]!" is visible
- [ ] Current date is displayed
- [ ] Month/year header shows current month
- [ ] Weekday headers (Mon-Sun) are visible
- [ ] Day cells are rendered in a grid
- [ ] Today's date is highlighted (purple background)
- [ ] Navigation arrows (< >) are visible
- [ ] FAB (+) button is visible at bottom right

**Automation Commands:**
```
check: text "Hello" is visible
check: current month name is visible (e.g., "February 2026")
check: text "Mon" is visible
check: text "Sun" is visible
check: text "<" is visible
check: text ">" is visible
take screenshot
```

---

### ST-005: Calendar Navigation Works

**Priority:** P1
**Category:** Calendar

**Preconditions:** User is authenticated, calendar is displayed

**Steps:**
1. Note current month displayed
2. Click "<" (previous month) button
3. Verify month changes
4. Click ">" (next month) button twice
5. Verify month changes correctly

**Expected Results:**
- [ ] Clicking "<" shows previous month
- [ ] Clicking ">" shows next month
- [ ] Month/year text updates correctly
- [ ] Calendar grid updates with correct days
- [ ] Loading indicator may appear briefly

**Automation Commands:**
```
note current month text
click "<"
wait 1 second
check: month changed to previous month
take screenshot
click ">"
wait 1 second
click ">"
wait 1 second
check: month is one month ahead of original
take screenshot
```

---

### ST-006: Sign Out Works

**Priority:** P0
**Category:** Authentication

**Preconditions:** User is authenticated

**Steps:**
1. Click "Sign Out" button in header
2. Verify redirect to login page

**Expected Results:**
- [ ] Clicking "Sign Out" logs user out
- [ ] User is redirected to login page
- [ ] "Continue with Google" button is visible again
- [ ] Refreshing page keeps user on login page

**Automation Commands:**
```
click "Sign Out"
wait 2 seconds
check: text "Continue with Google" is visible
check: text "Hello" is NOT visible
take screenshot
refresh page
wait 2 seconds
check: still on login page
```

---

### ST-007: Session Persistence Works

**Priority:** P1
**Category:** Authentication

**Preconditions:** User is authenticated

**Steps:**
1. Verify user is on home page
2. Refresh the browser
3. Verify user is still authenticated

**Expected Results:**
- [ ] After refresh, user remains authenticated
- [ ] Home page loads (not login page)
- [ ] User info and calendar are displayed

**Automation Commands:**
```
check: text "Hello" is visible
refresh page
wait 3 seconds
check: text "Hello" is visible
check: text "Continue with Google" is NOT visible
take screenshot
```

---

### ST-008: Error Boundary Catches Errors

**Priority:** P2
**Category:** Error Handling

**Steps:**
1. Trigger an error in the app (e.g., via console injection)
2. Verify error boundary UI appears
3. Click "Try Again" button
4. Verify app recovers

**Expected Results:**
- [ ] Error boundary displays ":(" emoji
- [ ] "Something went wrong" text is visible
- [ ] "Try Again" button is visible
- [ ] Clicking "Try Again" attempts recovery

**Note:** This test may require injecting errors via browser console.

---

### ST-009: 401 Error Triggers Logout

**Priority:** P1
**Category:** Authentication / Error Handling

**Preconditions:** User is authenticated with expired/invalid token

**Steps:**
1. Invalidate the access token (via devtools/localStorage)
2. Trigger an API call (navigate months)
3. Verify automatic logout

**Expected Results:**
- [ ] When API returns 401, user is logged out
- [ ] User is redirected to login page
- [ ] Error message may briefly appear

**Note:** Requires manually invalidating token in localStorage.

---

### ST-010: Calendar Events Display

**Priority:** P1
**Category:** Calendar

**Preconditions:** User is authenticated, has events in Google Calendar

**Steps:**
1. Navigate to month with calendar events
2. Verify event indicators appear

**Expected Results:**
- [ ] Days with events show colored dots
- [ ] Days with 4+ events show "+" indicator
- [ ] Dot colors match Google Calendar color scheme

**Note:** Requires having events in Google Calendar.

---

## Running Smoke Tests with Claude

To execute these tests using Claude's Chrome automation:

```
/smoke-test
```

Or ask:
> "Run the smoke tests for the habits app"

Claude will:
1. Start the Expo web server if not running
2. Open Chrome to the app URL
3. Execute each test case
4. Take screenshots at key points
5. Update this document with results

---

## Updating This Document

After each test run, update:
1. "Last executed" date at the top
2. Status column in the execution table
3. "Last Run" date for each test
4. Notes for any failures or observations

After app changes, update:
1. "Last updated" date
2. Test steps if UI changed
3. Expected results if behavior changed
4. Add new test cases for new features
5. Remove obsolete test cases

---

## Test Environment

| Property | Value |
|----------|-------|
| Browser | Chrome (via Claude automation) |
| Platform | Web (Expo for Web) |
| URL | http://localhost:8081 |
| Auth Provider | Google OAuth |

---

*This document should be kept in sync with app functionality.*
