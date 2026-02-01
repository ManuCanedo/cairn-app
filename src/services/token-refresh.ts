/**
 * Token Refresh Service
 *
 * Handles OAuth token refresh with:
 * - Concurrency handling (single refresh at a time)
 * - Platform-aware behavior (native refresh, web no-op)
 * - Auth store integration
 */
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';
import { GOOGLE_CLIENT_ID } from '../config/constants';
import { getRefreshToken, storeRefreshToken, deleteRefreshToken } from './token-storage';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Error thrown when token refresh fails
 */
export class TokenRefreshError extends Error {
  constructor(
    message: string,
    public readonly isRevoked = false
  ) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

// Singleton promise to prevent concurrent refresh requests
let refreshPromise: Promise<TokenRefreshResult> | null = null;

interface TokenRefreshResult {
  accessToken: string;
  expiresAt: number;
}

/**
 * Refresh the access token using the stored refresh token.
 *
 * Handles concurrency: multiple callers will share the same refresh request.
 *
 * @throws {TokenRefreshError} If refresh fails or no refresh token available
 */
export async function refreshAccessToken(): Promise<TokenRefreshResult> {
  // Return existing refresh promise if one is in progress
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefreshAccessToken();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefreshAccessToken(): Promise<TokenRefreshResult> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new TokenRefreshError('No refresh token available');
  }

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    // If the refresh token is revoked or invalid, clear it
    if (data.error === 'invalid_grant') {
      await deleteRefreshToken();
      throw new TokenRefreshError(data.error_description || 'Refresh token revoked', true);
    }
    throw new TokenRefreshError(data.error_description || 'Token refresh failed');
  }

  // Store new refresh token if provided (token rotation)
  if (data.refresh_token) {
    await storeRefreshToken(data.refresh_token);
  }

  const expiresAt = Date.now() + data.expires_in * 1000;

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Get a valid access token, refreshing if necessary.
 *
 * On web: Returns null if token is expired (no refresh possible).
 * On native: Attempts to refresh using stored refresh token.
 *
 * @returns Valid access token or null if not available
 */
export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, expiresAt, isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated || !accessToken) {
    return null;
  }

  const now = Date.now();
  const isExpired = !expiresAt || now >= expiresAt;
  const needsRefresh = isExpired || now >= expiresAt - TOKEN_EXPIRY_BUFFER_MS;

  if (!needsRefresh) {
    return accessToken;
  }

  // Web: Can't refresh, return null for expired tokens
  if (Platform.OS === 'web') {
    return isExpired ? null : accessToken;
  }

  // Native: Attempt refresh
  try {
    const result = await refreshAccessToken();
    const { user } = useAuthStore.getState();

    // Update auth store with new token
    useAuthStore.getState().setAuth({
      accessToken: result.accessToken,
      refreshToken: null, // Refresh token stays in secure storage
      expiresAt: result.expiresAt,
      user,
    });

    return result.accessToken;
  } catch {
    return null;
  }
}
