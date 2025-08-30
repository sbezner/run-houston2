import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { FilterState } from '../types';
import { uniqueCities } from '../utils/uniqueCities';
import { Race } from '../types';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
  races: Race[];
}

export function FilterSheet({ visible, onClose, onApply, currentFilters, races }: FilterSheetProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    setFilters(currentFilters);
    setCities(uniqueCities(races));
  }, [currentFilters, races]);

  const toggleFilter = (category: keyof FilterState, value: any) => {
    if (category === 'distances' || category === 'surface') {
      const currentArray = filters[category] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      setFilters({ ...filters, [category]: newArray });
    } else if (category === 'locationRadius') {
      setFilters({ ...filters, locationRadius: value });
    } else if (category === 'city') {
      setFilters({ ...filters, city: value });
    } else if (category === 'useLocation') {
      setFilters({ ...filters, useLocation: value });
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const defaultFilters: FilterState = {
      preset: 'next30',
      distances: [],
      surface: [],
      useLocation: false,
      locationRadius: null,
      city: 'all',
    };
    setFilters(defaultFilters);
  };

  const distanceOptions = ['5K', '10K', 'Half', 'Full', 'Ultra', 'Kids'];
  const surfaceOptions = ['road', 'trail', 'track'];
  const radiusOptions = [5, 10, 25, 50];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Distance Section */}
          <Text style={styles.sectionTitle}>Distance</Text>
          <View style={styles.chipContainer}>
            {distanceOptions.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.chip,
                  filters.distances.includes(distance as any) && styles.chipActive,
                ]}
                onPress={() => toggleFilter('distances', distance)}
              >
                <Text style={[
                  styles.chipText,
                  filters.distances.includes(distance as any) && styles.chipTextActive,
                ]}>
                  {distance}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Surface Section */}
          <Text style={styles.sectionTitle}>Surface</Text>
          <View style={styles.chipContainer}>
            {surfaceOptions.map((surface) => (
              <TouchableOpacity
                key={surface}
                style={[
                  styles.chip,
                  filters.surface.includes(surface as any) && styles.chipActive,
                ]}
                onPress={() => toggleFilter('surface', surface)}
              >
                <Text style={[
                  styles.chipText,
                  filters.surface.includes(surface as any) && styles.chipTextActive,
                ]}>
                  {surface.charAt(0).toUpperCase() + surface.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.locationToggle}>
            <Text style={styles.locationLabel}>Use current location</Text>
            <Switch
              value={filters.useLocation}
              onValueChange={(value) => toggleFilter('useLocation', value)}
            />
          </View>

          {filters.useLocation ? (
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Radius (miles):</Text>
              <View style={styles.chipContainer}>
                {radiusOptions.map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.chip,
                      filters.locationRadius === radius && styles.chipActive,
                    ]}
                    onPress={() => toggleFilter('locationRadius', radius)}
                  >
                    <Text style={[
                      styles.chipText,
                      filters.locationRadius === radius && styles.chipTextActive,
                    ]}>
                      {radius}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.cityContainer}>
              <Text style={styles.cityLabel}>City:</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    filters.city === 'all' && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter('city', 'all')}
                >
                  <Text style={[
                    styles.chipText,
                    filters.city === 'all' && styles.chipTextActive,
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {cities.slice(0, 20).map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.chip,
                      filters.city === city && styles.chipActive,
                    ]}
                    onPress={() => toggleFilter('city', city)}
                  >
                    <Text style={[
                      styles.chipText,
                      filters.city === city && styles.chipTextActive,
                    ]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
                {cities.length > 20 && (
                  <TouchableOpacity style={styles.moreChip}>
                    <Text style={styles.moreChipText}>More...</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Show Results</Text>
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    color: '#333',
  },
  radiusContainer: {
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  cityContainer: {
    marginBottom: 16,
  },
  cityLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  moreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 20,
  },
  moreChipText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
