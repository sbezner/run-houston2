import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActionSheetIOS, Platform, Alert } from 'react-native';
import { FilterState } from '../types';
import { useDateFilter } from '../state/dateFilter';

interface ToolbarProps {
  currentPreset: string;
  activeFilterCount: number;
  onDatePress: () => void;
  onFiltersPress: () => void;
  onNavigateToClubs: () => void;
  onNavigateToReports: () => void;
  onNavigateToAbout: () => void;
  scrollY: Animated.Value;
}

export function Toolbar({ 
  currentPreset, 
  activeFilterCount, 
  onDatePress, 
  onFiltersPress,
  onNavigateToClubs,
  onNavigateToReports,
  onNavigateToAbout,
  scrollY 
}: ToolbarProps) {
  const { labelForApplied } = useDateFilter();

  const toolbarPadding = scrollY.interpolate({
    inputRange: [0, 8],
    outputRange: [16, 8],
    extrapolate: 'clamp',
  });

  const handleMorePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Clubs', 'Race Reports', 'About'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              onNavigateToClubs();
              break;
            case 2:
              onNavigateToReports();
              break;
            case 3:
              onNavigateToAbout();
              break;
          }
        }
      );
    } else {
      // Android - show custom action sheet or alert
      Alert.alert(
        'More Options',
        'Choose an option:',
        [
          { text: 'Clubs', onPress: onNavigateToClubs },
          { text: 'Race Reports', onPress: onNavigateToReports },
          { text: 'About', onPress: onNavigateToAbout },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Toolbar */}
      <Animated.View style={[styles.toolbar, { paddingVertical: toolbarPadding }]}>
        {/* Left: Date Pill */}
        <TouchableOpacity style={styles.datePill} onPress={onDatePress} activeOpacity={0.7}>
          <Text style={styles.datePillText}>{labelForApplied()}</Text>
        </TouchableOpacity>

        {/* Center: More Menu */}
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress} activeOpacity={0.7}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>

        {/* Right: Filters Pill */}
        <TouchableOpacity style={styles.filtersPill} onPress={onFiltersPress} activeOpacity={0.7}>
          <Text style={styles.filtersPillText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
  },
  datePill: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    marginRight: 8,
  },
  datePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  moreButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  filtersPill: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  filtersPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
