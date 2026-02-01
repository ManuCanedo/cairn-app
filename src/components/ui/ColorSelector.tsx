import { View, Pressable, StyleSheet } from 'react-native';

/** Google Calendar color options */
export const GOOGLE_COLORS = [
  { id: '1', name: 'Lavender', hex: '#7986cb' },
  { id: '2', name: 'Sage', hex: '#33b679' },
  { id: '3', name: 'Grape', hex: '#8e24aa' },
  { id: '4', name: 'Flamingo', hex: '#e67c73' },
  { id: '5', name: 'Banana', hex: '#f6c026' },
  { id: '6', name: 'Tangerine', hex: '#f5511d' },
  { id: '7', name: 'Peacock', hex: '#039be5' },
  { id: '8', name: 'Graphite', hex: '#616161' },
  { id: '9', name: 'Blueberry', hex: '#3f51b5' },
  { id: '10', name: 'Basil', hex: '#0b8043' },
  { id: '11', name: 'Tomato', hex: '#d60000' },
] as const;

interface ColorSelectorProps {
  selectedColorId: string;
  onSelectColor: (colorId: string) => void;
}

export function ColorSelector({ selectedColorId, onSelectColor }: ColorSelectorProps) {
  return (
    <View style={styles.container}>
      {GOOGLE_COLORS.map((color) => (
        <Pressable
          key={color.id}
          onPress={() => onSelectColor(color.id)}
          style={[
            styles.colorCircle,
            { backgroundColor: color.hex },
            selectedColorId === color.id && styles.selected,
          ]}
          accessibilityLabel={color.name}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedColorId === color.id }}
          testID={`color-${color.id}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#111827',
  },
});
