import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore, type User } from '../store/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '../config/constants';
import { storeRefreshToken, deleteRefreshToken } from './token-storage';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { setAuth, setLoading, logout } = useAuthStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [...GOOGLE_SCOPES],
    // Request offline access on native to get refresh tokens
    ...(Platform.OS !== 'web' && { accessType: 'offline' }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // Store refresh token in SecureStore on native platforms
        if (authentication.refreshToken) {
          storeRefreshToken(authentication.refreshToken);
        }

        fetchUserInfo(authentication.accessToken).then((userInfo) => {
          setAuth({
            accessToken: authentication.accessToken,
            refreshToken: null, // Refresh token stored in SecureStore, not in state
            expiresAt: authentication.expiresIn
              ? Date.now() + authentication.expiresIn * 1000
              : null,
            user: userInfo,
          });
        });
      }
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      setLoading(false);
    }
  }, [response, setAuth, setLoading]);

  const signIn = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  const signOut = () => {
    deleteRefreshToken(); // Clear refresh token from SecureStore
    logout();
  };

  return {
    signIn,
    signOut,
    isReady: !!request,
  };
}

async function fetchUserInfo(accessToken: string): Promise<User | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await response.json()) as User;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}
