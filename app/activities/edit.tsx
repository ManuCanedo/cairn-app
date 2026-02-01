import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useActivitiesStore } from '../../src/store/activities';
import { ColorSelector } from '../../src/components/ui/ColorSelector';
import { EmojiSelector } from '../../src/components/ui/EmojiSelector';

export default function EditActivityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addTemplate, updateTemplate, getTemplateById } = useActivitiesStore();

  const isEditing = !!id;
  const existingTemplate = id ? getTemplateById(id) : undefined;

  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [emoji, setEmoji] = useState(existingTemplate?.emoji ?? '🧘');
  const [colorId, setColorId] = useState(existingTemplate?.colorId ?? '7');

  // Update state if template changes (e.g., navigating to different edit)
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setEmoji(existingTemplate.emoji);
      setColorId(existingTemplate.colorId);
    }
  }, [existingTemplate]);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a name for your activity.');
      return;
    }

    if (isEditing && id) {
      updateTemplate(id, { name: trimmedName, emoji, colorId });
    } else {
      addTemplate({ name: trimmedName, emoji, colorId });
    }

    router.back();
  };

  const isValid = name.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Activity' : 'New Activity',
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              disabled={!isValid}
              testID="save-activity"
            >
              <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            </Pressable>
          ),
        }}
      />

      {/* Preview */}
      <View style={styles.preview}>
        <Text style={styles.previewEmoji}>{emoji}</Text>
        <Text style={styles.previewName}>{name || 'Activity Name'}</Text>
      </View>

      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Meditate, Exercise, Read"
          placeholderTextColor="#9CA3AF"
          maxLength={50}
          testID="activity-name-input"
        />
      </View>

      {/* Emoji Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <EmojiSelector selectedEmoji={emoji} onSelectEmoji={setEmoji} />
      </View>

      {/* Color Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <ColorSelector selectedColorId={colorId} onSelectColor={setColorId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  saveButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  preview: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
});
