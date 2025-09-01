import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { FilterState } from '../types';

interface ActiveFiltersBarProps {
  filters: FilterState;
  onRemoveFilter: (type: keyof FilterState, value?: any) => void;
  onClearAll: () => void;
}

export default function ActiveFiltersBar({ filters, onRemoveFilter, onClearAll }: ActiveFiltersBarProps) {
  const activeFilters: Array<{ type: keyof FilterState; label: string; value?: any }> = [];
  
  // Add distance filters
  filters.distances.forEach(distance => {
    activeFilters.push({ type: 'distances', label: distance, value: distance });
  });
  
  // Add surface filters
  filters.surface.forEach(surface => {
    activeFilters.push({ type: 'surface', label: surface, value: surface });
  });
  
  // Add location filter
  if (filters.useLocation && filters.locationRadius) {
    activeFilters.push({ type: 'locationRadius', label: `${filters.locationRadius} mi radius` });
  } else if (filters.city !== 'all') {
    activeFilters.push({ type: 'city', label: filters.city });
  }
  
  // Add custom date filter
  if (filters.preset === 'custom' && filters.dateFrom && filters.dateTo) {
    activeFilters.push({ type: 'preset', label: `${filters.dateFrom} to ${filters.dateTo}` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {activeFilters.map((filter, index) => (
          <Pressable
            key={`${filter.type}-${index}`}
            style={styles.filterPill}
            onPress={() => onRemoveFilter(filter.type, filter.value)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${filter.label} filter`}
          >
            <Text style={styles.filterPillText}>{filter.label}</Text>
            <Text style={styles.filterPillRemove}>×</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        style={styles.clearAllButton}
        onPress={onClearAll}
        accessibilityRole="button"
        accessibilityLabel="Clear all filters"
      >
        <Text style={styles.clearAllText}>Clear All</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 32,
  },
  filterPillText: {
    fontSize: 12,
    color: '#3C3C43',
    marginRight: 4,
  },
  filterPillRemove: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
