# Cairn

> _A cairn is a stack of stones marking a path or summit. Each stone you add marks your journey._

Minimalist mobile app to visualize and record your positive activities using Google Calendar as a backend.

## Vision

An app where you define your wellness activities (templates) and record them day by day. The calendar shows at a glance, with colors, how you've taken care of yourself that month. No excessive gamification, no aggressive notifications. Just the essentials to create consistency and awareness.

Each activity you record is another stone in your personal cairn.

## Core Concept

1. **Login with Google** → Access to your calendar
2. **"Cairn" Calendar** → Automatically created in your Google Calendar
3. **Activity templates** → Define your positive activities once (Meditate, Exercise, Read...)
4. **Quick registration** → + button to add an activity to the current day (all-day event)
5. **Calendar view** → See the month with colors based on completed activities

## Tech Stack

| Layer             | Technology                       | Justification                                |
| ----------------- | -------------------------------- | -------------------------------------------- |
| Framework         | React Native + Expo SDK 54       | Cross-platform with real native components   |
| Language          | TypeScript                       | Type safety, better DX with AI               |
| Navigation        | Expo Router                      | File-based routing, simple and scalable      |
| Auth              | expo-auth-session + Google OAuth | Google login, Calendar API access            |
| Backend           | Google Calendar API              | No own server, data lives in user's calendar |
| Local state       | Zustand                          | Template cache, UI state                     |
| Local persistence | AsyncStorage                     | Activity template cache                      |
| UI                | React Native core                | Native components, native look & feel        |

## Architecture

```
cairn/
├── app/                        # Routes (expo-router)
│   ├── _layout.tsx             # Root layout + auth check
│   ├── index.tsx               # Main screen (calendar)
│   ├── login.tsx               # Login screen
│   └── activities/
│       ├── index.tsx           # Manage activity templates
│       └── add.tsx             # Add activity to day
├── src/
│   ├── components/
│   │   ├── Calendar.tsx        # Monthly calendar view
│   │   ├── ActivityPicker.tsx  # Activity selector (+ button)
│   │   └── DayCell.tsx         # Calendar cell with colors
│   ├── services/
│   │   ├── google-auth.ts      # Google OAuth logic
│   │   └── google-calendar.ts  # Google Calendar API CRUD
│   ├── store/
│   │   ├── auth.ts             # Authentication state
│   │   └── activities.ts       # Activity templates
│   └── types/
│       ├── activity.ts         # Activity types
│       └── calendar.ts         # Calendar event types
├── assets/
└── docs/
```

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. FIRST USE                                                │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────────┐ │
│  │  Login  │ → │  Create     │ → │  Define positive     │ │
│  │  Google │    │  "Cairn"    │    │  activities          │ │
│  └─────────┘    │  calendar   │    │  (templates)         │ │
│                 └─────────────┘    └──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  2. DAILY USE                                                │
│  ┌─────────────┐    ┌─────────┐    ┌────────────────────┐   │
│  │  View       │ → │  Press  │ → │  Select completed  │   │
│  │  calendar   │    │    +    │    │  activity          │   │
│  └─────────────┘    └─────────┘    └────────────────────┘   │
│         │                                    │               │
│         └────────────────────────────────────┘               │
│                   Added to calendar                          │
└─────────────────────────────────────────────────────────────┘
```

## Technical Decisions

### 2025-01-31: Name "Cairn"

- **Decision**: Name the app "Cairn" (stone pile that marks paths)
- **Reason**: Perfect visual metaphor - each habit/activity is a stone that marks your progress. Minimalist, unique, memorable.

### 2025-01-31: Initial stack

- **Decision**: React Native + Expo over Flutter or Ionic
- **Reason**: Better ecosystem for AI-assisted development, real native components

### 2025-01-31: Google Calendar as backend

- **Decision**: Use Google Calendar API instead of own backend
- **Reason**: No infrastructure to maintain, data under user control, automatic sync with other devices/calendar apps

### 2025-01-31: All-day events

- **Decision**: Activities are recorded as all-day events
- **Reason**: Simplicity, exact time doesn't matter, just that it was done. Enables "color" view for the month.

### 2025-01-31: Local templates + cloud events

- **Decision**: Activity templates saved locally (AsyncStorage), records go to Google Calendar
- **Reason**: Templates are quick personal config, records need cloud persistence

## Development Setup

### 1. Google Cloud Console (required)

```
1. Create project at console.cloud.google.com (name: "Cairn")
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (type: web/iOS/Android app)
4. Configure OAuth consent screen
5. Add scopes: calendar.events, calendar.calendars
```

### 2. Environment variables

```bash
# .env (don't commit)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
```

### 3. Commands

```bash
npm run web      # Development in browser
npm run ios      # iOS (Expo Go or simulator)
npm run android  # Android (Expo Go or emulator)
```

## Next Steps

See [GitHub Issues](https://github.com/ManuCanedo/cairn-app/issues) for pending tasks and features.
