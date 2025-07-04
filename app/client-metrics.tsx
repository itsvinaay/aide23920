import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  X,
  Save,
  Activity,
  Target,
  Droplets,
  Footprints
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { MetricChart } from '@/components/MetricChart';
import MetricHistoryList from '@/components/MetricHistoryList';
import { 
  getMetrics, 
  addMetricEntry, 
  getMetric,
  MetricData,
  Metric,
  MetricType 
} from '@/utils/metricsStorage';

const { width } = Dimensions.get('window');

const metricConfigs = [
  { key: 'weight', name: 'Weight', unit: 'kg', icon: '⚖️', color: '#3B82F6' },
  { key: 'chest', name: 'Chest', unit: 'in', icon: '💪', color: '#10B981' },
  { key: 'shoulders', name: 'Shoulders', unit: 'in', icon: '🏋️', color: '#F59E0B' },
  { key: 'waist', name: 'Waist', unit: 'in', icon: '📏', color: '#EF4444' },
  { key: 'thigh', name: 'Thigh', unit: 'in', icon: '🦵', color: '#8B5CF6' },
  { key: 'hip', name: 'Hip', unit: 'in', icon: '📐', color: '#EC4899' },
  { key: 'bodyFat', name: 'Body Fat', unit: '%', icon: '📊', color: '#06B6D4' },
  { key: 'bicep', name: 'Bicep', unit: 'in', icon: '💪', color: '#84CC16' },
  { key: 'waterIntake', name: 'Water Intake', unit: 'L', icon: '💧', color: '#0EA5E9' },
  { key: 'steps', name: 'Steps', unit: 'steps', icon: '👣', color: '#F97316' },
];

export default function ClientMetricsScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  const [metrics, setMetrics] = useState<MetricData>({});
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const metricsData = await getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
      Alert.alert('Error', 'Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricPress = (metricKey: string) => {
    setSelectedMetric(metricKey);
  };

  const handleAddEntry = () => {
    if (!selectedMetric) return;
    setShowAddModal(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedMetric || !newValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    const value = parseFloat(newValue);
    if (isNaN(value)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      await addMetricEntry(selectedMetric as MetricType, value);
      await loadMetrics();
      setShowAddModal(false);
      setNewValue('');
      Alert.alert('Success', 'Metric entry added successfully');
    } catch (error) {
      console.error('Error adding metric entry:', error);
      Alert.alert('Error', 'Failed to add metric entry');
    }
  };

  const getMetricChange = (metric: Metric): { value: number; isPositive: boolean } | null => {
    if (metric.entries.length < 2) return null;
    
    const latest = metric.entries[0].value;
    const previous = metric.entries[1].value;
    const change = latest - previous;
    
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const renderMetricCard = (config: any) => {
    const metric = metrics[config.key];
    const change = metric ? getMetricChange(metric) : null;
    
    return (
      <TouchableOpacity
        key={config.key}
        style={[
          styles.metricCard,
          selectedMetric === config.key && styles.selectedMetricCard
        ]}
        onPress={() => handleMetricPress(config.key)}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: `${config.color}15` }]}>
            <Text style={styles.metricEmoji}>{config.icon}</Text>
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricName}>{config.name}</Text>
            <Text style={styles.metricUnit}>{config.unit}</Text>
          </View>
        </View>
        
        <View style={styles.metricValue}>
          <Text style={[styles.currentValue, { color: config.color }]}>
            {metric?.currentValue || '--'}
          </Text>
          {change && (
            <View style={styles.changeContainer}>
              {change.isPositive ? (
                <TrendingUp size={12} color={colors.success} />
              ) : (
                <TrendingDown size={12} color={colors.error} />
              )}
              <Text style={[
                styles.changeText,
                { color: change.isPositive ? colors.success : colors.error }
              ]}>
                {change.value.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        
        {metric?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last: {metric.lastUpdated}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMetricDetail = () => {
    if (!selectedMetric) return null;
    
    const config = metricConfigs.find(c => c.key === selectedMetric);
    const metric = metrics[selectedMetric];
    
    if (!config || !metric) return null;

    const chartData = metric.entries.slice(0, 10).reverse().map(entry => ({
      date: entry.date,
      value: entry.value
    }));

    const historyData = [
      {
        label: 'Recent Entries',
        value: `${metric.entries.length} total`,
        expanded: true,
        entries: metric.entries.slice(0, 10).map(entry => ({
          date: entry.date,
          time: entry.time,
          value: `${entry.value} ${entry.unit}`
        }))
      }
    ];

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedMetric(null)}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{config.name}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddEntry}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Current Value */}
          <View style={styles.currentValueCard}>
            <Text style={styles.currentValueLabel}>Current Value</Text>
            <Text style={[styles.currentValueLarge, { color: config.color }]}>
              {metric.currentValue} {config.unit}
            </Text>
            {metric.lastUpdated && (
              <Text style={styles.lastUpdatedDetail}>
                Last updated: {metric.lastUpdated}
              </Text>
            )}
          </View>

          {/* Chart */}
          {chartData.length > 1 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Progress Chart</Text>
              <MetricChart 
                data={chartData} 
                colors={colors}
                height={200}
                widthOverride={width - 80}
              />
            </View>
          )}

          {/* Statistics */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {metric.entries.length}
                </Text>
                <Text style={styles.statLabel}>Total Entries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {metric.entries.length > 0 
                    ? Math.max(...metric.entries.map(e => e.value)).toFixed(1)
                    : '--'
                  }
                </Text>
                <Text style={styles.statLabel}>Highest</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {metric.entries.length > 0 
                    ? Math.min(...metric.entries.map(e => e.value)).toFixed(1)
                    : '--'
                  }
                </Text>
                <Text style={styles.statLabel}>Lowest</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {metric.entries.length > 0 
                    ? (metric.entries.reduce((sum, e) => sum + e.value, 0) / metric.entries.length).toFixed(1)
                    : '--'
                  }
                </Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
            </View>
          </View>

          {/* History */}
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>History</Text>
            <MetricHistoryList data={historyData} />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedMetric ? 'Metric Details' : 'Your Metrics'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {selectedMetric ? renderMetricDetail() : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.overviewCards}>
              <View style={styles.overviewCard}>
                <Target size={24} color={colors.primary} />
                <Text style={styles.overviewNumber}>
                  {Object.values(metrics).filter(m => m.entries.length > 0).length}
                </Text>
                <Text style={styles.overviewLabel}>Active Metrics</Text>
              </View>
              
              <View style={styles.overviewCard}>
                <Calendar size={24} color={colors.success} />
                <Text style={styles.overviewNumber}>
                  {Object.values(metrics).reduce((total, m) => total + m.entries.length, 0)}
                </Text>
                <Text style={styles.overviewLabel}>Total Entries</Text>
              </View>
              
              <View style={styles.overviewCard}>
                <TrendingUp size={24} color={colors.warning} />
                <Text style={styles.overviewNumber}>
                  {Object.values(metrics).filter(m => {
                    if (m.entries.length < 2) return false;
                    return m.entries[0].value > m.entries[1].value;
                  }).length}
                </Text>
                <Text style={styles.overviewLabel}>Improving</Text>
              </View>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>All Metrics</Text>
            <View style={styles.metricsGrid}>
              {metricConfigs.map(renderMetricCard)}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Droplets size={20} color={colors.info} />
                <Text style={styles.quickActionText}>Log Water</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <Footprints size={20} color={colors.warning} />
                <Text style={styles.quickActionText}>Log Steps</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <Target size={20} color={colors.success} />
                <Text style={styles.quickActionText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Entry</Text>
            <TouchableOpacity onPress={handleSaveEntry}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {selectedMetric && (
              <>
                <Text style={styles.modalMetricName}>
                  {metricConfigs.find(c => c.key === selectedMetric)?.name}
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.valueInput}
                    value={newValue}
                    onChangeText={setNewValue}
                    placeholder="Enter value"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={styles.unitLabel}>
                    {metricConfigs.find(c => c.key === selectedMetric)?.unit}
                  </Text>
                </View>
                
                <Text style={styles.inputHint}>
                  Current: {metrics[selectedMetric]?.currentValue || '--'} {metricConfigs.find(c => c.key === selectedMetric)?.unit}
                </Text>
              </>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  overviewCards: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginVertical: 8,
  },
  overviewLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 64) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedMetricCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricEmoji: {
    fontSize: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  metricUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  lastUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textTertiary,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentValueCard: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentValueLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  currentValueLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    marginBottom: 8,
  },
  lastUpdatedDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  chartCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  historyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    padding: 20,
  },
  modalMetricName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  valueInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  inputHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});