import Constants from 'expo-constants';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_ID_IOS,
  GOOGLE_CLIENT_ID_ANDROID,
  EXPO_USERNAME,
  APP_SLUG,
  GOOGLE_SCOPES,
} from '../../config/constants';

describe('constants', () => {
  describe('Google OAuth Configuration', () => {
    it('exports GOOGLE_CLIENT_ID from config', () => {
      expect(GOOGLE_CLIENT_ID).toBe('test-client-id');
    });

    it('exports GOOGLE_CLIENT_ID_IOS with fallback empty string', () => {
      expect(GOOGLE_CLIENT_ID_IOS).toBe('');
    });

    it('exports GOOGLE_CLIENT_ID_ANDROID with fallback empty string', () => {
      expect(GOOGLE_CLIENT_ID_ANDROID).toBe('');
    });
  });

  describe('Expo Configuration', () => {
    it('exports EXPO_USERNAME from config', () => {
      expect(EXPO_USERNAME).toBe('test-user');
    });

    it('exports APP_SLUG from config', () => {
      expect(APP_SLUG).toBe('cairn');
    });
  });

  describe('GOOGLE_SCOPES', () => {
    it('contains openid scope', () => {
      expect(GOOGLE_SCOPES).toContain('openid');
    });

    it('contains profile scope', () => {
      expect(GOOGLE_SCOPES).toContain('profile');
    });

    it('contains email scope', () => {
      expect(GOOGLE_SCOPES).toContain('email');
    });

    it('contains calendar scope', () => {
      expect(GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/calendar');
    });

    it('contains calendar.events scope', () => {
      expect(GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    it('has exactly 5 scopes', () => {
      expect(GOOGLE_SCOPES).toHaveLength(5);
    });
  });
});

describe('getEnvVar (via module behavior)', () => {
  it('throws error when required env var is missing', () => {
    // Test by requiring a fresh module with missing config
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {},
      },
    }));

    expect(() => {
      require('../../config/constants');
    }).toThrow('Missing environment variable: googleClientId');
  });
});
