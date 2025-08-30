import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { rangeToday, rangeTomorrow, rangeThisWeekend, rangeNextNDays, toISODate } from '../utils/dateRanges';

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (preset: string, dateFrom?: string, dateTo?: string) => void;
  currentPreset: string;
}

export function DateSheet({ visible, onClose, onConfirm, currentPreset }: DateSheetProps) {
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handlePreset = (preset: string) => {
    const now = new Date();
    let dateFrom: string;
    let dateTo: string;

    switch (preset) {
      case 'today':
        const today = rangeToday(now);
        dateFrom = toISODate(today.start);
        dateTo = toISODate(today.start);
        break;
      case 'tomorrow':
        const tomorrow = rangeTomorrow(now);
        dateFrom = toISODate(tomorrow.start);
        dateTo = toISODate(tomorrow.start);
        break;
      case 'weekend':
        const weekend = rangeThisWeekend(now);
        dateFrom = toISODate(weekend.start);
        dateTo = toISODate(weekend.end);
        break;
      case 'next7':
        const next7 = rangeNextNDays(7, now);
        dateFrom = toISODate(next7.start);
        dateTo = toISODate(next7.end);
        break;
      case 'next30':
        const next30 = rangeNextNDays(30, now);
        dateFrom = toISODate(next30.start);
        dateTo = toISODate(next30.end);
        break;
      default:
        return;
    }

    onConfirm(preset, dateFrom, dateTo);
    onClose();
  };

  const handleCustom = () => {
    if (!customFrom || !customTo) {
      Alert.alert('Error', 'Please enter both start and end dates');
      return;
    }

    if (customFrom > customTo) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    onConfirm('custom', customFrom, customTo);
    onClose();
  };

  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'weekend', label: 'This Weekend' },
    { key: 'next7', label: 'Next 7 Days' },
    { key: 'next30', label: 'Next 30 Days' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Date Range</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={[
                styles.presetButton,
                currentPreset === preset.key && styles.presetButtonActive,
              ]}
              onPress={() => handlePreset(preset.key)}
            >
              <Text style={[
                styles.presetText,
                currentPreset === preset.key && styles.presetTextActive,
              ]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Custom Range</Text>
          <View style={styles.customContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From:</Text>
              <TextInput
                style={styles.dateInput}
                value={customFrom}
                onChangeText={setCustomFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>To:</Text>
              <TextInput
                style={styles.dateInput}
                value={customTo}
                onChangeText={setCustomTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity style={styles.customButton} onPress={handleCustom}>
              <Text style={styles.customButtonText}>Apply Custom Range</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  presetButton: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetText: {
    fontSize: 16,
    color: '#333',
  },
  presetTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customContainer: {
    marginTop: 8,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  customButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  customButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
