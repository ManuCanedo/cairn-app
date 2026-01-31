import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import type { User } from '../store/auth';
import { useAuthStore } from '../store/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '../config/constants';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { setAuth, setLoading, logout } = useAuthStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: GOOGLE_SCOPES,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken).then((userInfo) => {
          setAuth({
            accessToken: authentication.accessToken,
            refreshToken: authentication.refreshToken ?? null,
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
