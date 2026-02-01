// Dynamic Expo configuration
// Environment variables are loaded at build time

// Validate required environment variables
if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
  console.warn(
    'WARNING: EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set. ' +
      'Google OAuth will not work. See .env.example for setup instructions.'
  );
}

export default {
  expo: {
    name: 'Cairn',
    slug: 'cairn',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'cairn',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.manu.cairn',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.manu.cairn',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: ['expo-router'],
    extra: {
      // OAuth credentials - use EXPO_PUBLIC_ prefix for Expo to load them
      // See .env.example for required environment variables
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
      googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
      expoUsername: process.env.EXPO_PUBLIC_USERNAME,
      appSlug: 'cairn',
    },
  },
};
