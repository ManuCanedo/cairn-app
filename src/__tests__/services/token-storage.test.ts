/**
 * Tests for token-storage service
 *
 * Platform-aware secure storage for refresh tokens:
 * - iOS/Android: Uses expo-secure-store
 * - Web: No-op (web uses implicit OAuth without refresh tokens)
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from '../../services/token-storage';

describe('token-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on native platforms (iOS)', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('stores refresh token in SecureStore', async () => {
      await storeRefreshToken('test-refresh-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cairn_refresh_token',
        'test-refresh-token'
      );
    });

    it('retrieves refresh token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored-refresh-token');

      const token = await getRefreshToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('cairn_refresh_token');
      expect(token).toBe('stored-refresh-token');
    });

    it('returns null when no token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const token = await getRefreshToken();

      expect(token).toBeNull();
    });

    it('deletes refresh token from SecureStore', async () => {
      await deleteRefreshToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cairn_refresh_token');
    });
  });

  describe('on native platforms (Android)', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('stores refresh token in SecureStore', async () => {
      await storeRefreshToken('android-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cairn_refresh_token', 'android-token');
    });

    it('retrieves refresh token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('android-stored-token');

      const token = await getRefreshToken();

      expect(token).toBe('android-stored-token');
    });

    it('deletes refresh token from SecureStore', async () => {
      await deleteRefreshToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cairn_refresh_token');
    });
  });

  describe('on web platform', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('does not store refresh token (no-op)', async () => {
      await storeRefreshToken('web-token');

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns null for refresh token (web has no refresh tokens)', async () => {
      const token = await getRefreshToken();

      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
      expect(token).toBeNull();
    });

    it('does not attempt to delete (no-op)', async () => {
      await deleteRefreshToken();

      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
