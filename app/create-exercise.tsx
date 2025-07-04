import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Plus, 
  X,
  ChevronDown,
  Trash2,
  GripVertical,
  Save,
  Edit3,
  Target,
  Clock,
  Hash
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Exercise, WorkoutSet } from '@/types/workout';
import { getExercises, saveExercises } from '@/utils/storage';
import { generateId } from '@/utils/workoutUtils';

const defaultCategories = [
  'Strength',
  'Cardio', 
  'Bodyweight',
  'HIIT',
  'Flexibility',
  'Olympic Lifting',
  'Powerlifting',
  'Functional',
  'Rehabilitation',
  'Sports Specific',
];

const defaultMuscleGroups = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Full Body',
];

const defaultEquipment = [
  'None (Bodyweight)',
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Resistance Bands',
  'Cable Machine',
  'Pull-up Bar',
  'Bench',
  'Medicine Ball',
  'TRX',
  'Cardio Machine',
  'Other',
];

interface SetTemplate {
  id: string;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

export default function CreateExerciseScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { edit, duplicate } = useLocalSearchParams();

  // Basic exercise info
  const [exerciseName, setExerciseName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  
  // Custom options
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [muscleGroups, setMuscleGroups] = useState<string[]>(defaultMuscleGroups);
  const [equipment, setEquipment] = useState<string[]>(defaultEquipment);
  
  // Sets configuration
  const [setTemplates, setSetTemplates] = useState<SetTemplate[]>([
    { id: generateId(), reps: 10, weight: 0, restTime: 60 },
    { id: generateId(), reps: 10, weight: 0, restTime: 60 },
    { id: generateId(), reps: 10, weight: 0, restTime: 60 },
  ]);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showSetConfigModal, setShowSetConfigModal] = useState(false);
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newMuscleGroupName, setNewMuscleGroupName] = useState('');
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [tempSet, setTempSet] = useState<SetTemplate | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isTimeBased, setIsTimeBased] = useState(false);

  const isEditing = !!edit;
  const isDuplicating = !!duplicate;

  useEffect(() => {
    if (isEditing || isDuplicating) {
      loadExercise();
    }
  }, []);

  const loadExercise = async () => {
    try {
      const exerciseId = (edit || duplicate) as string;
      const exercises = await getExercises();
      const exercise = exercises.find(ex => ex.id === exerciseId);
      
      if (exercise) {
        setExerciseName(isDuplicating ? `${exercise.name} (Copy)` : exercise.name);
        setSelectedCategory(exercise.category);
        setSelectedMuscleGroups(exercise.muscleGroups);
        setSelectedEquipment(exercise.equipment || '');
        setInstructions(exercise.instructions || '');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      Alert.alert('Error', 'Failed to load exercise');
    }
  };

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setSelectedMuscleGroups(prev => 
      prev.includes(muscleGroup)
        ? prev.filter(mg => mg !== muscleGroup)
        : [...prev, muscleGroup]
    );
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      setSelectedCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  const handleAddMuscleGroup = () => {
    if (newMuscleGroupName.trim() && !muscleGroups.includes(newMuscleGroupName.trim())) {
      setMuscleGroups(prev => [...prev, newMuscleGroupName.trim()]);
      setSelectedMuscleGroups(prev => [...prev, newMuscleGroupName.trim()]);
      setNewMuscleGroupName('');
      setShowMuscleGroupModal(false);
    }
  };

  const handleAddEquipment = () => {
    if (newEquipmentName.trim() && !equipment.includes(newEquipmentName.trim())) {
      setEquipment(prev => [...prev, newEquipmentName.trim()]);
      setSelectedEquipment(newEquipmentName.trim());
      setNewEquipmentName('');
      setShowEquipmentModal(false);
    }
  };

  const handleAddSet = () => {
    const newSet: SetTemplate = {
      id: generateId(),
      reps: isTimeBased ? undefined : 10,
      duration: isTimeBased ? 30 : undefined,
      weight: 0,
      restTime: 60,
    };
    setSetTemplates(prev => [...prev, newSet]);
  };

  const handleEditSet = (set: SetTemplate) => {
    setEditingSetId(set.id);
    setTempSet({ ...set });
    setShowSetConfigModal(true);
  };

  const handleSaveSet = () => {
    if (tempSet && editingSetId) {
      setSetTemplates(prev => prev.map(set => 
        set.id === editingSetId ? tempSet : set
      ));
      setShowSetConfigModal(false);
      setEditingSetId(null);
      setTempSet(null);
    }
  };

  const handleRemoveSet = (setId: string) => {
    if (setTemplates.length > 1) {
      setSetTemplates(prev => prev.filter(set => set.id !== setId));
    }
  };

  const handleSaveExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (selectedMuscleGroups.length === 0) {
      Alert.alert('Error', 'Please select at least one muscle group');
      return;
    }

    setLoading(true);
    try {
      const exercises = await getExercises();
      
      const newExercise: Exercise = {
        id: isEditing ? (edit as string) : generateId(),
        name: exerciseName.trim(),
        category: selectedCategory,
        muscleGroups: selectedMuscleGroups,
        instructions: instructions.trim() || undefined,
        equipment: selectedEquipment || undefined,
      };

      const updatedExercises = isEditing 
        ? exercises.map(ex => ex.id === newExercise.id ? newExercise : ex)
        : [...exercises, newExercise];
      
      await saveExercises(updatedExercises);

      Alert.alert(
        'Success',
        `Exercise ${isEditing ? 'updated' : 'created'} successfully!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise');
    } finally {
      setLoading(false);
    }
  };

  const renderSetTemplate = (set: SetTemplate, index: number) => (
    <View key={set.id} style={styles.setTemplateCard}>
      <View style={styles.setTemplateHeader}>
        <View style={styles.setTemplateInfo}>
          <Text style={styles.setTemplateTitle}>Set {index + 1}</Text>
          <Text style={styles.setTemplateDetails}>
            {set.reps ? `${set.reps} reps` : ''}
            {set.duration ? `${set.duration}s` : ''}
            {set.weight ? ` @ ${set.weight}kg` : ''}
            {set.restTime ? ` • Rest: ${set.restTime}s` : ''}
          </Text>
        </View>
        <View style={styles.setTemplateActions}>
          <TouchableOpacity 
            style={styles.setActionButton}
            onPress={() => handleEditSet(set)}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
          {setTemplates.length > 1 && (
            <TouchableOpacity 
              style={styles.setActionButton}
              onPress={() => handleRemoveSet(set.id)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Exercise' : isDuplicating ? 'Duplicate Exercise' : 'Create Exercise'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveExercise}
          disabled={loading}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Information</Text>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Exercise Name *</Text>
            <TextInput
              style={styles.textInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="Enter exercise name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[
                styles.pickerText,
                !selectedCategory && styles.placeholderText
              ]}>
                {selectedCategory || 'Select category'}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Difficulty Level</Text>
            <View style={styles.difficultyButtons}>
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.selectedDifficultyButton
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    difficulty === level && styles.selectedDifficultyButtonText
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Muscle Groups *</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMuscleGroupModal(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Select all muscle groups this exercise targets</Text>
          <View style={styles.optionsGrid}>
            {muscleGroups.map((muscleGroup) => (
              <TouchableOpacity
                key={muscleGroup}
                style={[
                  styles.optionChip,
                  selectedMuscleGroups.includes(muscleGroup) && styles.selectedOptionChip
                ]}
                onPress={() => handleMuscleGroupToggle(muscleGroup)}
              >
                <Text style={[
                  styles.optionText,
                  selectedMuscleGroups.includes(muscleGroup) && styles.selectedOptionText
                ]}>
                  {muscleGroup}
                </Text>
                {selectedMuscleGroups.includes(muscleGroup) && (
                  <X size={14} color="#FFFFFF" style={styles.removeIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowEquipmentModal(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsGrid}>
            {equipment.map((equipmentItem) => (
              <TouchableOpacity
                key={equipmentItem}
                style={[
                  styles.optionChip,
                  selectedEquipment === equipmentItem && styles.selectedOptionChip
                ]}
                onPress={() => setSelectedEquipment(equipmentItem)}
              >
                <Text style={[
                  styles.optionText,
                  selectedEquipment === equipmentItem && styles.selectedOptionText
                ]}>
                  {equipmentItem}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default Sets Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Default Sets Configuration</Text>
            <View style={styles.sectionActions}>
              <View style={styles.timeBasedToggle}>
                <Text style={styles.toggleLabel}>Time-based</Text>
                <Switch
                  value={isTimeBased}
                  onValueChange={setIsTimeBased}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSet}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addButtonText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Configure default sets for this exercise. Users can modify these when creating workouts.
          </Text>
          
          <View style={styles.setTemplatesContainer}>
            {setTemplates.map(renderSetTemplate)}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.sectionSubtitle}>Provide step-by-step instructions for proper form</Text>
          <TextInput
            style={styles.textArea}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Enter detailed instructions for proper form and execution..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.addNewSection}>
              <Text style={styles.addNewTitle}>Add New Category</Text>
              <View style={styles.addNewContainer}>
                <TextInput
                  style={styles.addNewInput}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    !newCategoryName.trim() && styles.addNewButtonDisabled
                  ]}
                  onPress={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.optionsList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionItem,
                    selectedCategory === category && styles.selectedOptionItem
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.optionItemText,
                    selectedCategory === category && styles.selectedOptionItemText
                  ]}>
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Muscle Group Modal */}
      <Modal
        visible={showMuscleGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMuscleGroupModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Muscle Groups</Text>
            <TouchableOpacity onPress={() => setShowMuscleGroupModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.addNewSection}>
              <Text style={styles.addNewTitle}>Add New Muscle Group</Text>
              <View style={styles.addNewContainer}>
                <TextInput
                  style={styles.addNewInput}
                  value={newMuscleGroupName}
                  onChangeText={setNewMuscleGroupName}
                  placeholder="Enter muscle group name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    !newMuscleGroupName.trim() && styles.addNewButtonDisabled
                  ]}
                  onPress={handleAddMuscleGroup}
                  disabled={!newMuscleGroupName.trim()}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.optionsList}>
              {muscleGroups.map((muscleGroup) => (
                <TouchableOpacity
                  key={muscleGroup}
                  style={[
                    styles.optionItem,
                    selectedMuscleGroups.includes(muscleGroup) && styles.selectedOptionItem
                  ]}
                  onPress={() => handleMuscleGroupToggle(muscleGroup)}
                >
                  <Text style={[
                    styles.optionItemText,
                    selectedMuscleGroups.includes(muscleGroup) && styles.selectedOptionItemText
                  ]}>
                    {muscleGroup}
                  </Text>
                  {selectedMuscleGroups.includes(muscleGroup) && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Equipment Modal */}
      <Modal
        visible={showEquipmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Equipment</Text>
            <TouchableOpacity onPress={() => setShowEquipmentModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.addNewSection}>
              <Text style={styles.addNewTitle}>Add New Equipment</Text>
              <View style={styles.addNewContainer}>
                <TextInput
                  style={styles.addNewInput}
                  value={newEquipmentName}
                  onChangeText={setNewEquipmentName}
                  placeholder="Enter equipment name"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    !newEquipmentName.trim() && styles.addNewButtonDisabled
                  ]}
                  onPress={handleAddEquipment}
                  disabled={!newEquipmentName.trim()}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.optionsList}>
              {equipment.map((equipmentItem) => (
                <TouchableOpacity
                  key={equipmentItem}
                  style={[
                    styles.optionItem,
                    selectedEquipment === equipmentItem && styles.selectedOptionItem
                  ]}
                  onPress={() => {
                    setSelectedEquipment(equipmentItem);
                    setShowEquipmentModal(false);
                  }}
                >
                  <Text style={[
                    styles.optionItemText,
                    selectedEquipment === equipmentItem && styles.selectedOptionItemText
                  ]}>
                    {equipmentItem}
                  </Text>
                  {selectedEquipment === equipmentItem && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Set Configuration Modal */}
      <Modal
        visible={showSetConfigModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSetConfigModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSetConfigModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configure Set</Text>
            <TouchableOpacity onPress={handleSaveSet}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {tempSet && (
            <View style={styles.modalContent}>
              <View style={styles.setConfigGrid}>
                {!isTimeBased ? (
                  <View style={styles.configField}>
                    <Text style={styles.configLabel}>Reps</Text>
                    <View style={styles.configInputContainer}>
                      <Hash size={16} color={colors.textSecondary} />
                      <TextInput
                        style={styles.configInput}
                        value={tempSet.reps?.toString() || ''}
                        onChangeText={(text) => setTempSet(prev => prev ? { ...prev, reps: parseInt(text) || 0 } : null)}
                        placeholder="10"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.configField}>
                    <Text style={styles.configLabel}>Duration (seconds)</Text>
                    <View style={styles.configInputContainer}>
                      <Clock size={16} color={colors.textSecondary} />
                      <TextInput
                        style={styles.configInput}
                        value={tempSet.duration?.toString() || ''}
                        onChangeText={(text) => setTempSet(prev => prev ? { ...prev, duration: parseInt(text) || 0 } : null)}
                        placeholder="30"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.configField}>
                  <Text style={styles.configLabel}>Weight (kg)</Text>
                  <View style={styles.configInputContainer}>
                    <Target size={16} color={colors.textSecondary} />
                    <TextInput
                      style={styles.configInput}
                      value={tempSet.weight?.toString() || ''}
                      onChangeText={(text) => setTempSet(prev => prev ? { ...prev, weight: parseFloat(text) || 0 } : null)}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.configField}>
                  <Text style={styles.configLabel}>Rest Time (seconds)</Text>
                  <View style={styles.configInputContainer}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput
                      style={styles.configInput}
                      value={tempSet.restTime?.toString() || ''}
                      onChangeText={(text) => setTempSet(prev => prev ? { ...prev, restTime: parseInt(text) || 0 } : null)}
                      placeholder="60"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.configField}>
                <Text style={styles.configLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.configTextArea}
                  value={tempSet.notes || ''}
                  onChangeText={(text) => setTempSet(prev => prev ? { ...prev, notes: text } : null)}
                  placeholder="Add any specific notes for this set..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  timeBasedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedDifficultyButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
  },
  selectedDifficultyButtonText: {
    color: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOptionChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  removeIcon: {
    marginLeft: 6,
  },
  setTemplatesContainer: {
    gap: 12,
  },
  setTemplateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setTemplateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setTemplateInfo: {
    flex: 1,
  },
  setTemplateTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  setTemplateDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  setTemplateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  setActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  addNewSection: {
    marginBottom: 24,
  },
  addNewTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  addNewContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addNewInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  addNewButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButtonDisabled: {
    opacity: 0.5,
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedOptionItem: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  optionItemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  selectedOptionItemText: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  selectedIndicator: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.primary,
  },
  setConfigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  configField: {
    flex: 1,
    minWidth: '45%',
  },
  configLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  configInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  configInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  configTextArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});