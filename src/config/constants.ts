import Constants from 'expo-constants';

/** Retrieves environment variable from Expo config, throwing if required and missing. */
function getEnvVar(key: string, fallback?: string): string {
  const value = Constants.expoConfig?.extra?.[key] as string | undefined;
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing environment variable: ${key}`);
}

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = getEnvVar('googleClientId');
export const GOOGLE_CLIENT_ID_IOS = getEnvVar('googleClientIdIos', '');
export const GOOGLE_CLIENT_ID_ANDROID = getEnvVar('googleClientIdAndroid', '');

// Expo username for auth redirect
export const EXPO_USERNAME = getEnvVar('expoUsername');

// App slug for auth redirect
export const APP_SLUG = getEnvVar('appSlug');

/** Google Calendar API scopes required for OAuth. */
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
] as const;
