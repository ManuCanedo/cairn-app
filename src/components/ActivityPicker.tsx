import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useActivitiesStore } from '../store/activities';
import { GOOGLE_COLORS } from './ui/ColorSelector';
import type { ActivityTemplate } from '../types/activity';

interface ActivityPickerProps {
  visible: boolean;
  onSelect: (template: ActivityTemplate) => void;
  onClose: () => void;
  onCreateActivity?: () => void;
  isLoading?: boolean;
}

function getColorHex(colorId: string): string {
  return GOOGLE_COLORS.find((c) => c.id === colorId)?.hex ?? '#4F46E5';
}

export default function ActivityPicker({
  visible,
  onSelect,
  onClose,
  onCreateActivity,
  isLoading = false,
}: ActivityPickerProps) {
  const { templates } = useActivitiesStore();

  if (!visible) {
    return null;
  }

  const renderActivity = ({ item }: { item: ActivityTemplate }) => (
    <Pressable
      onPress={() => onSelect(item)}
      style={[styles.activityItem, { borderLeftColor: getColorHex(item.colorId) }]}
      disabled={isLoading}
      testID={`activity-item-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Log ${item.name}`}
    >
      <Text style={styles.activityEmoji}>{item.emoji}</Text>
      <Text style={styles.activityName}>{item.name}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="picker-backdrop">
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header} testID="activity-picker-modal">
            <Text style={styles.title}>Log Activity</Text>
            <Pressable onPress={onClose} style={styles.closeButton} testID="close-picker-button">
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay} testID="picker-loading">
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          )}

          {templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No activities yet</Text>
              <Text style={styles.emptySubtitle}>Create your first activity</Text>
              <Pressable
                onPress={onCreateActivity}
                style={styles.createButton}
                testID="create-activity-button"
              >
                <Text style={styles.createButtonText}>+ Create Activity</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={templates}
              renderItem={renderActivity}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              numColumns={2}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 10,
  },
  list: {
    padding: 12,
  },
  activityItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    maxWidth: '45%',
  },
  activityEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
