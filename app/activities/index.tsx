import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useActivitiesStore } from '../../src/store/activities';
import { GOOGLE_COLORS } from '../../src/components/ui/ColorSelector';
import type { ActivityTemplate } from '../../src/types/activity';

function getColorHex(colorId: string): string {
  return GOOGLE_COLORS.find((c) => c.id === colorId)?.hex ?? '#4F46E5';
}

function ActivityItem({
  template,
  onPress,
  onDelete,
}: {
  template: ActivityTemplate;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress} testID={`activity-${template.id}`}>
      <View style={styles.itemContent}>
        <View style={[styles.colorDot, { backgroundColor: getColorHex(template.colorId) }]} />
        <Text style={styles.emoji}>{template.emoji}</Text>
        <Text style={styles.name}>{template.name}</Text>
      </View>
      <Pressable
        onPress={onDelete}
        style={styles.deleteButton}
        testID={`delete-${template.id}`}
        accessibilityLabel={`Delete ${template.name}`}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </Pressable>
  );
}

export default function ActivitiesListScreen() {
  const router = useRouter();
  const { templates, deleteTemplate } = useActivitiesStore();

  const handleAdd = () => {
    router.push('/activities/edit');
  };

  const handleEdit = (id: string) => {
    router.push(`/activities/edit?id=${id}`);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Activities',
          headerRight: () => (
            <Pressable onPress={handleAdd} style={styles.addButton} testID="add-activity">
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          ),
        }}
      />

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🪨</Text>
          <Text style={styles.emptyTitle}>No activities yet</Text>
          <Text style={styles.emptyText}>
            Create your first activity to start tracking your positive habits.
          </Text>
          <Pressable onPress={handleAdd} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Create Activity</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityItem
              template={item}
              onPress={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  addButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
