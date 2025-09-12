import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FilterState } from '../types';

interface DatePresetBarProps {
  preset: FilterState['preset'];
  onPresetChange: (preset: FilterState['preset']) => void;
}

const presets: Array<{ key: FilterState['preset']; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'This Weekend' },
  { key: 'next7', label: 'Next 7 Days' },
  { key: 'next30', label: 'Next 30 Days' },
  { key: 'custom', label: 'Custom' },
];

export default function DatePresetBar({ preset, onPresetChange }: DatePresetBarProps) {
  return (
    <View style={styles.container}>
      {presets.map(({ key, label }) => (
        <Pressable
          key={key}
          style={[
            styles.presetChip,
            preset === key ? styles.presetChipActive : styles.presetChipInactive
          ]}
          onPress={() => onPresetChange(key)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${label} date range`}
          accessibilityState={{ selected: preset === key }}
        >
          <Text style={[
            styles.presetChipText,
            preset === key ? styles.presetChipTextActive : styles.presetChipTextInactive
          ]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#007AFF',
  },
  presetChipInactive: {
    backgroundColor: '#F2F2F7',
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  presetChipTextInactive: {
    color: '#8E8E93',
  },
});
