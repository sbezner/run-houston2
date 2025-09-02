import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FixedDatePicker from './FixedDatePicker';
import { useDateFilter, Preset } from '../state/dateFilter';

// Safe date bounds for picker constraints
const FAR_PAST = new Date(2000, 0, 1);
const FAR_FUTURE = new Date(2100, 0, 1);

interface DateSheetProps {
  visible: boolean;
  onClose: () => void;
}

const DateSheet: React.FC<DateSheetProps> = ({ visible, onClose }) => {
  const { 
    draft, 
    applied, 
    openDraftFromApplied, 
    setDraftPreset, 
    setDraftRange, 
    applyDraft, 
    resetDraftToApplied, 
    hasPendingChanges 
  } = useDateFilter();

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Initialize draft from applied when sheet opens
  useEffect(() => {
    if (visible) {
      openDraftFromApplied();
    }
  }, [visible, openDraftFromApplied]);

  const handleClose = () => {
    resetDraftToApplied();
    onClose();
  };

  const handleApply = () => {
    applyDraft();
    onClose();
  };

  const handlePresetSelect = (preset: Preset) => {
    setDraftPreset(preset);
  };

  const handleFromDateChange = (date: Date) => {
    setDraftRange(date, draft.range.to);
    setShowFromPicker(false);
  };

  const handleToDateChange = (date: Date) => {
    setDraftRange(draft.range.from, date);
    setShowToPicker(false);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isPresetSelected = (preset: Preset) => draft.preset === preset;
  const isCustomSelected = () => {
    // Show custom inputs as selected when:
    // 1. Preset is 'custom' and has dates, OR
    // 2. Any preset other than 'all' is selected (they all have calculated dates)
    return (draft.preset === 'custom' && (draft.range.from || draft.range.to)) || 
           (draft.preset !== 'all' && (draft.range.from || draft.range.to));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay} pointerEvents={showFromPicker || showToPicker ? 'none' : 'auto'}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Pending Changes Hint */}
          {hasPendingChanges() && (
            <Text style={styles.pendingHint}>Changes pending</Text>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quick Select Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select</Text>
              <View style={styles.quickSelectGrid}>
                <TouchableOpacity
                  style={[
                    styles.quickSelectButton,
                    isPresetSelected('all') && styles.selectedButton
                  ]}
                  onPress={() => handlePresetSelect('all')}
                >
                  <Text style={[
                    styles.quickSelectText,
                    isPresetSelected('all') && styles.selectedButtonText
                  ]}>All Dates</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickSelectButton,
                    isPresetSelected('thisWeekend') && styles.selectedButton
                  ]}
                  onPress={() => handlePresetSelect('thisWeekend')}
                >
                  <Text style={[
                    styles.quickSelectText,
                    isPresetSelected('thisWeekend') && styles.selectedButtonText
                  ]}>This Weekend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickSelectButton,
                    isPresetSelected('next30') && styles.selectedButton
                  ]}
                  onPress={() => handlePresetSelect('next30')}
                >
                  <Text style={[
                    styles.quickSelectText,
                    isPresetSelected('next30') && styles.selectedButtonText
                  ]}>Next 30 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickSelectButton,
                    isPresetSelected('next90') && styles.selectedButton
                  ]}
                  onPress={() => handlePresetSelect('next90')}
                >
                  <Text style={[
                    styles.quickSelectText,
                    isPresetSelected('next90') && styles.selectedButtonText
                  ]}>Next 90 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickSelectButton,
                    isPresetSelected('last90') && styles.selectedButton
                  ]}
                  onPress={() => handlePresetSelect('last90')}
                >
                  <Text style={[
                    styles.quickSelectText,
                    isPresetSelected('last90') && styles.selectedButtonText
                  ]}>Last 90 Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Range</Text>
              
              <View style={styles.dateInputRow}>
                <Text style={styles.dateLabel}>From:</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    isCustomSelected() && styles.selectedDateInput
                  ]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(draft.range.from)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputRow}>
                <Text style={styles.dateLabel}>To:</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    isCustomSelected() && styles.selectedDateInput
                  ]}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(draft.range.to)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Date Pickers - Using FixedDatePicker to avoid nested modal issues */}
        <FixedDatePicker
          visible={showFromPicker}
          mode="date"
          initial={draft.range.from || new Date()}
          minimumDate={FAR_PAST}
          maximumDate={FAR_FUTURE}
          title="Select Start Date"
          onCancel={() => setShowFromPicker(false)}
          onConfirm={handleFromDateChange}
        />

        <FixedDatePicker
          visible={showToPicker}
          mode="date"
          initial={draft.range.to || (draft.range.from || new Date())}
          minimumDate={draft.range.from || FAR_PAST}
          maximumDate={FAR_FUTURE}
          title="Select End Date"
          onCancel={() => setShowToPicker(false)}
          onConfirm={handleToDateChange}
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
  pendingHint: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    fontStyle: 'italic',
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
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  quickSelectText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 14,
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: '600',
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
  selectedDateInput: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
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
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
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
});

export default DateSheet;
