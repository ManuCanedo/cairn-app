import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Authenticated user profile from Google OAuth. */
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (auth: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
    user: User | null;
  }) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: ({ accessToken, refreshToken, expiresAt, user }) => {
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        return !expiresAt || Date.now() >= expiresAt;
      },
    }),
    {
      name: 'cairn-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        // refreshToken is stored in SecureStore, not persisted here
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
