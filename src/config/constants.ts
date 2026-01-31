// Google OAuth Configuration
// In production, these should come from environment variables
export const GOOGLE_CLIENT_ID = '2006113013377-gn4n7u9b89v1g1i0aq0e8dbrmler57dt.apps.googleusercontent.com';

// Expo username for auth redirect
export const EXPO_USERNAME = 'manuel.canedo';

// App slug for auth redirect
export const APP_SLUG = 'cairn';

// Google Calendar API scopes
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
