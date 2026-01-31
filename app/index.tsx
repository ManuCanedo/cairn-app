import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { useGoogleAuth } from '../src/services/google-auth';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { signOut } = useGoogleAuth();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cairn',
          headerRight: () => (
            <Pressable onPress={signOut} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Sign Out</Text>
            </Pressable>
          ),
        }}
      />

      {/* User Info */}
      <View style={styles.userSection}>
        {user?.picture && (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        )}
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}!</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      {/* Placeholder for Calendar */}
      <View style={styles.calendarPlaceholder}>
        <Text style={styles.placeholderIcon}>📅</Text>
        <Text style={styles.placeholderTitle}>Calendar Coming Soon</Text>
        <Text style={styles.placeholderText}>
          Your positive activities will appear here as colorful markers on your calendar.
        </Text>
      </View>

      {/* Floating Add Button */}
      <Pressable style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  calendarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
    marginTop: -2,
  },
});
