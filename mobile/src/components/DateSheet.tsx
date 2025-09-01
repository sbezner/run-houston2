import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FixedDatePicker from './FixedDatePicker';

// Safe date bounds for picker constraints
const FAR_PAST = new Date(2000, 0, 1);
const FAR_FUTURE = new Date(2100, 0, 1);

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (fromDate: string, toDate: string) => void;
}

const DateSheet: React.FC<DateSheetProps> = ({ visible, onClose, onApply }) => {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleFromDateChange = (date: Date) => {
    setFromDate(date);
    setShowFromPicker(false);
  };

  const handleToDateChange = (date: Date) => {
    setToDate(date);
    setShowToPicker(false);
  };

  const handleQuickSelect = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setFromDate(startDate);
    setToDate(endDate);
  };

  const handleCustom = () => {
    if (!fromDate || !toDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    if (fromDate > toDate) {
      Alert.alert('Error', 'Start date must be before end date');
      return;
    }

    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    onApply(fromDateStr, toDateStr);
    onClose();
  };

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay} pointerEvents={showFromPicker || showToPicker ? 'none' : 'auto'}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quick Select Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select</Text>
              <View style={styles.quickSelectGrid}>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => handleQuickSelect(7)}
                >
                  <Text style={styles.quickSelectText}>Last 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => handleQuickSelect(30)}
                >
                  <Text style={styles.quickSelectText}>Last 30 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => handleQuickSelect(90)}
                >
                  <Text style={styles.quickSelectText}>Last 90 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => handleQuickSelect(365)}
                >
                  <Text style={styles.quickSelectText}>Last Year</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Range</Text>
              
              <View style={styles.dateInputRow}>
                <Text style={styles.dateLabel}>From:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(fromDate)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputRow}>
                <Text style={styles.dateLabel}>To:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(toDate)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.applyButton]}
                onPress={handleCustom}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>

            {/* QA Smoke Test Button - Development Only */}
            {__DEV__ && (
              <View style={styles.smokeTestSection}>
                <Text style={styles.sectionTitle}>QA Test</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#FF6B6B', marginTop: 10 }]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={[styles.applyButtonText, { color: 'white' }]}>Test Date Picker (iOS)</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Date Pickers - Using FixedDatePicker to avoid nested modal issues */}
        <FixedDatePicker
          visible={showFromPicker}
          mode="date"
          initial={fromDate || new Date()}
          minimumDate={FAR_PAST}
          maximumDate={FAR_FUTURE}
          title="Select Start Date"
          onCancel={() => setShowFromPicker(false)}
          onConfirm={(d) => {
            setShowFromPicker(false);
            setFromDate(d);
            // Keep range valid
            if (toDate && toDate < d) setToDate(d);
          }}
        />

        <FixedDatePicker
          visible={showToPicker}
          mode="date"
          initial={toDate || (fromDate || new Date())}
          minimumDate={fromDate || FAR_PAST}
          maximumDate={FAR_FUTURE}
          title="Select End Date"
          onCancel={() => setShowToPicker(false)}
          onConfirm={(d) => {
            setShowToPicker(false);
            setToDate(d);
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickSelectButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: '45%',
  },
  quickSelectText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 14,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 60,
    marginRight: 15,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  smokeTestSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
});

export default DateSheet;
