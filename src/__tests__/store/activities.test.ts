import { useActivitiesStore } from '../../store/activities';
import type { ActivityTemplate } from '../../types/activity';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto for UUID generation
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

describe('activities store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useActivitiesStore.setState({
      templates: [],
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty templates array', () => {
      const { templates } = useActivitiesStore.getState();
      expect(templates).toEqual([]);
    });
  });

  describe('addTemplate', () => {
    it('adds a new template with generated id and timestamp', () => {
      const { addTemplate } = useActivitiesStore.getState();

      addTemplate({ name: 'Meditate', emoji: '🧘', colorId: '7' });

      const { templates } = useActivitiesStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0]).toMatchObject({
        id: 'test-uuid-123',
        name: 'Meditate',
        emoji: '🧘',
        colorId: '7',
      });
      expect(templates[0].createdAt).toBeGreaterThan(0);
    });

    it('can add multiple templates', () => {
      const { addTemplate } = useActivitiesStore.getState();

      addTemplate({ name: 'Meditate', emoji: '🧘', colorId: '7' });
      addTemplate({ name: 'Exercise', emoji: '💪', colorId: '2' });

      const { templates } = useActivitiesStore.getState();
      expect(templates).toHaveLength(2);
    });
  });

  describe('updateTemplate', () => {
    it('updates an existing template', () => {
      // Setup: add a template first
      useActivitiesStore.setState({
        templates: [
          {
            id: 'existing-id',
            name: 'Meditate',
            emoji: '🧘',
            colorId: '7',
            createdAt: 1000,
          },
        ],
      });

      const { updateTemplate } = useActivitiesStore.getState();
      updateTemplate('existing-id', { name: 'Deep Meditation', colorId: '3' });

      const { templates } = useActivitiesStore.getState();
      expect(templates[0]).toMatchObject({
        id: 'existing-id',
        name: 'Deep Meditation',
        emoji: '🧘',
        colorId: '3',
        createdAt: 1000, // unchanged
      });
    });

    it('does nothing if template not found', () => {
      useActivitiesStore.setState({
        templates: [
          {
            id: 'existing-id',
            name: 'Meditate',
            emoji: '🧘',
            colorId: '7',
            createdAt: 1000,
          },
        ],
      });

      const { updateTemplate } = useActivitiesStore.getState();
      updateTemplate('non-existent-id', { name: 'Updated' });

      const { templates } = useActivitiesStore.getState();
      expect(templates[0].name).toBe('Meditate');
    });
  });

  describe('deleteTemplate', () => {
    it('removes a template by id', () => {
      useActivitiesStore.setState({
        templates: [
          { id: 'id-1', name: 'A', emoji: '🅰️', colorId: '1', createdAt: 1000 },
          { id: 'id-2', name: 'B', emoji: '🅱️', colorId: '2', createdAt: 2000 },
        ],
      });

      const { deleteTemplate } = useActivitiesStore.getState();
      deleteTemplate('id-1');

      const { templates } = useActivitiesStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('id-2');
    });

    it('does nothing if template not found', () => {
      useActivitiesStore.setState({
        templates: [{ id: 'id-1', name: 'A', emoji: '🅰️', colorId: '1', createdAt: 1000 }],
      });

      const { deleteTemplate } = useActivitiesStore.getState();
      deleteTemplate('non-existent');

      const { templates } = useActivitiesStore.getState();
      expect(templates).toHaveLength(1);
    });
  });

  describe('getTemplateById', () => {
    it('returns template if found', () => {
      const template: ActivityTemplate = {
        id: 'find-me',
        name: 'Test',
        emoji: '🔍',
        colorId: '5',
        createdAt: 1000,
      };
      useActivitiesStore.setState({ templates: [template] });

      const { getTemplateById } = useActivitiesStore.getState();
      expect(getTemplateById('find-me')).toEqual(template);
    });

    it('returns undefined if not found', () => {
      useActivitiesStore.setState({ templates: [] });

      const { getTemplateById } = useActivitiesStore.getState();
      expect(getTemplateById('not-found')).toBeUndefined();
    });
  });
});
