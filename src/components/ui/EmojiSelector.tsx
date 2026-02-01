import { View, Text, Pressable, StyleSheet } from 'react-native';

/** Suggested emojis for activity templates */
export const SUGGESTED_EMOJIS = [
  '🧘',
  '💪',
  '📚',
  '😴',
  '🏃',
  '🚴',
  '🧠',
  '💧',
  '🥗',
  '🍎',
  '✍️',
  '🎨',
  '🎵',
  '🌅',
  '🌙',
  '⭐',
] as const;

interface EmojiSelectorProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

export function EmojiSelector({ selectedEmoji, onSelectEmoji }: EmojiSelectorProps) {
  return (
    <View style={styles.container}>
      {SUGGESTED_EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelectEmoji(emoji)}
          style={[styles.emojiButton, selectedEmoji === emoji && styles.selected]}
          accessibilityLabel={`Select ${emoji}`}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedEmoji === emoji }}
          testID={`emoji-${emoji}`}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  selected: {
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  emoji: {
    fontSize: 24,
  },
});
