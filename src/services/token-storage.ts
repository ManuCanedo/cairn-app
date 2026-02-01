/**
 * Token Storage Service
 *
 * Platform-aware secure storage for refresh tokens.
 *
 * - iOS/Android: Uses expo-secure-store for encrypted storage
 * - Web: No-op (web OAuth uses implicit flow without refresh tokens)
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'cairn_refresh_token';

/**
 * Store refresh token securely.
 * On web, this is a no-op since web OAuth doesn't provide refresh tokens.
 */
export async function storeRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * Retrieve stored refresh token.
 * Returns null on web (no refresh tokens available).
 */
export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Delete stored refresh token.
 * On web, this is a no-op.
 */
export async function deleteRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
