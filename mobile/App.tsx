import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { Race, RaceVM, FilterState } from './src/types';
import { normalizeRace } from './src/utils/normalizeRace';
import { uniqueCities } from './src/utils/uniqueCities';
import { milesBetween } from './src/utils/geo';
import { useUserLocation } from './src/hooks/useUserLocation';
import { Toolbar } from './src/components/Toolbar';
import { DateSheet } from './src/components/DateSheet';
import { FilterSheet } from './src/components/FilterSheet';
import { RaceCard } from './src/components/RaceCard';
import RaceMap from './src/components/RaceMap';
import { fetchRaces } from './src/api';
import AboutScreen from './src/components/AboutScreen';
import { ClubsScreen } from './src/screens/ClubsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';

// Create a context for sharing filters between screens
const FilterContext = createContext<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}>({
  filters: {
    preset: 'next30',
    distances: [],
    surface: [],
    useLocation: false,
    locationRadius: 25,
    city: 'all'
  },
  setFilters: () => {}
});

// Hook to use the filter context
const useFilters = () => useContext(FilterContext);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// List Stack Navigator
function ListStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Clubs" 
        component={ClubsScreen}
        options={{ title: 'Running Clubs' }}
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Race Reports' }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </Stack.Navigator>
  );
}

// Results Screen Component
function ResultsScreen({ navigation }: any) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  
  // Use shared filters from context
  const { filters, setFilters } = useFilters();

  const { coords, permission, request } = useUserLocation();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const racesData = await fetchRaces();
      setRaces(racesData);
    } catch (error) {
      console.error('Error loading races:', error);
      Alert.alert('Error', 'Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRaces();
    setRefreshing(false);
  };

  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handlePresetChange = (preset: string, dateFrom?: string, dateTo?: string) => {
    setFilters(prev => ({
      ...prev,
      preset: preset as any,
      dateFrom,
      dateTo,
    }));
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.distances.length > 0) count++;
    if (filters.surface.length > 0) count++;
    if (filters.useLocation && filters.locationRadius !== 25) count++;
    if (!filters.useLocation && filters.city !== 'all') count++;
    return count;
  };

  const getActiveFilters = (): string[] => {
    const active: string[] = [];
    if (filters.distances.length > 0) {
      active.push(filters.distances.join(', '));
    }
    if (filters.surface.length > 0) {
      active.push(filters.surface.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', '));
    }
    if (filters.useLocation && filters.locationRadius) {
      active.push(`${filters.locationRadius} mi radius`);
    }
    if (!filters.useLocation && filters.city !== 'all') {
      active.push(filters.city);
    }
    return active;
  };

  const removeFilter = (filterType: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'distances' || filterType === 'surface' ? [] : 
                   filterType === 'useLocation' ? false :
                   filterType === 'locationRadius' ? 25 :
                   filterType === 'city' ? 'all' : prev[filterType],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      preset: 'next30',
      distances: [],
      surface: [],
      useLocation: false,
      locationRadius: 25,
      city: 'all',
    });
  };

  const getSummaryText = (): string => {
    const presetLabels = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      weekend: 'This Weekend',
      next7: 'Next 7 Days',
      next30: 'Next 30 Days',
      custom: 'Custom Range',
    };

    const parts = [presetLabels[filters.preset]];
    const activeFilters = getActiveFilters();
    if (activeFilters.length > 0) {
      parts.push(...activeFilters);
    }
    return parts.join(' • ');
  };

  const getVisibleRaces = (): RaceVM[] => {
    let filtered = races.map(normalizeRace);

    // Debug logging for date filtering
    if (['today', 'tomorrow', 'weekend', 'next7'].includes(filters.preset)) {
      console.log('Filter preset:', filters.preset);
      console.log('Total races before filtering:', filtered.length);
      // Log first few race dates for debugging
      filtered.slice(0, 3).forEach(race => {
        console.log(`Race: ${race.name}, DateISO: ${race.dateISO}, Parsed: ${new Date(race.dateISO).toISOString()}`);
      });
    }

    // Date filtering
    if (filters.preset !== 'custom' && filters.preset !== 'next30') {
      const now = new Date();
      console.log('Current date:', now.toDateString(), 'Local timezone');
      
      // Simple date comparison - just get the date parts as strings
      const todayStr = now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
      
      let startDateStr: string;
      let endDateStr: string;

      switch (filters.preset) {
        case 'today':
          startDateStr = todayStr;
          endDateStr = todayStr;
          break;
        case 'tomorrow':
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          startDateStr = tomorrow.toLocaleDateString('en-CA');
          endDateStr = startDateStr;
          break;
        case 'weekend':
          const dayOfWeek = now.getDay();
          const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          const saturday = new Date(now);
          saturday.setDate(now.getDate() + daysUntilSaturday);
          const sunday = new Date(now);
          sunday.setDate(now.getDate() + daysUntilSunday);
          startDateStr = saturday.toLocaleDateString('en-CA');
          endDateStr = sunday.toLocaleDateString('en-CA');
          break;
        case 'next7':
          const nextWeek = new Date(now);
          nextWeek.setDate(now.getDate() + 7);
          startDateStr = todayStr;
          endDateStr = nextWeek.toLocaleDateString('en-CA');
          break;
        default:
          const nextMonth = new Date(now);
          nextMonth.setDate(now.getDate() + 30);
          startDateStr = todayStr;
          endDateStr = nextMonth.toLocaleDateString('en-CA');
      }

      // Debug: Log the calculated dates
      if (filters.preset === 'today' || filters.preset === 'weekend') {
        console.log('Current date info:');
        console.log('  now:', now.toDateString());
        console.log('  todayStr:', todayStr);
        console.log('  dayOfWeek:', now.getDay()); // 0=Sunday, 1=Monday, etc.
        console.log('Calculated dates:');
        console.log('  StartDate String:', startDateStr);
        console.log('  EndDate String:', endDateStr);
      }

      filtered = filtered.filter(race => {
        // Since both database and user are in Central Time, compare dates as strings
        // This avoids all timezone conversion issues
        const raceDateStr = race.dateISO;
        
        // For today and specific dates, include races that start on or after the start date
        // but before the end date (which is the next day)
        let isInRange = false;
        
        if (filters.preset === 'today') {
          isInRange = raceDateStr === startDateStr;
        } else if (filters.preset === 'tomorrow') {
          isInRange = raceDateStr === startDateStr;
        } else if (filters.preset === 'weekend') {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
        } else if (filters.preset === 'next7') {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
        } else {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
        }
        
        if (filters.preset === 'today' || filters.preset === 'weekend') {
          console.log(`Race: ${race.name}, Date: ${raceDateStr}`);
          if (filters.preset === 'today') {
            console.log(`  Today String: ${startDateStr}`);
            console.log(`  Race Date String: ${raceDateStr}`);
            console.log(`  String Comparison: ${raceDateStr} === ${startDateStr}`);
          } else {
            console.log(`  Weekend Range: ${startDateStr} to ${endDateStr}`);
            console.log(`  Race Date String: ${raceDateStr}`);
            console.log(`  String Comparison: ${raceDateStr} >= ${startDateStr} && ${raceDateStr} <= ${endDateStr}`);
          }
          console.log(`  InRange: ${isInRange}`);
        }
        
        return isInRange;
      });
      
      // Debug logging after date filtering
      if (['today', 'tomorrow', 'weekend', 'next7'].includes(filters.preset)) {
        console.log('Races after date filtering:', filtered.length);
      }
    } else if (filters.preset === 'custom' && filters.dateFrom && filters.dateTo) {
      const startDate = new Date(filters.dateFrom + 'T00:00:00.000Z');
      const endDate = new Date(filters.dateTo + 'T23:59:59.999Z');
      filtered = filtered.filter(race => {
        const raceDate = new Date(race.dateISO);
        return raceDate >= startDate && raceDate <= endDate;
      });
    }

    // Distance filtering
    if (filters.distances.length > 0) {
      filtered = filtered.filter(race =>
        race.distances?.some(distance => filters.distances.includes(distance as any))
      );
    }

    // Surface filtering
    if (filters.surface.length > 0) {
      filtered = filtered.filter(race =>
        race.surface && filters.surface.includes(race.surface as any)
      );
    }

    // Location filtering
    if (filters.useLocation && coords && filters.locationRadius) {
      filtered = filtered.filter(race => {
        if (!race.latitude || !race.longitude) return false;
        const distance = milesBetween(coords, { lat: race.latitude, lng: race.longitude });
        return distance <= filters.locationRadius!;
      });
    } else if (!filters.useLocation && filters.city !== 'all') {
      filtered = filtered.filter(race => race.city === filters.city);
    }

    // Sort by date ascending
    return filtered.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  };

  const visibleRaces = getVisibleRaces();

  const handleRacePress = (race: RaceVM) => {
    // Handle race selection - could open details or navigate to map
    console.log('Selected race:', race.name);
  };

  const handleLocationPermission = async () => {
    if (permission === 'undetermined') {
      const granted = await request();
      if (!granted) {
        Alert.alert(
          'Location Permission',
          'Location access is needed for radius filtering. You can still filter by city.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading races...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toolbar */}
      <Toolbar
        currentPreset={filters.preset}
        activeFilterCount={getActiveFilterCount()}
        summaryText={getSummaryText()}
        onDatePress={() => setDateSheetVisible(true)}
        onFiltersPress={() => setFilterSheetVisible(true)}
        onNavigateToClubs={() => navigation.navigate('Clubs')}
        onNavigateToReports={() => navigation.navigate('Reports')}
        onNavigateToAbout={() => navigation.navigate('About')}
        scrollY={scrollY}
      />

      {/* Active Filters Bar */}
      {getActiveFilterCount() > 0 && (
        <View style={styles.activeFiltersBar}>
          {getActiveFilters().map((filter, index) => (
            <View key={index} style={styles.filterPill}>
              <Text style={styles.filterPillText}>{filter}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  // This is a simplified removal - in a real app you'd want to identify which filter to remove
                  clearAllFilters();
                }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Race List */}
      <FlatList
        data={visibleRaces}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RaceCard race={item} onPress={() => handleRacePress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContainer}
        stickyHeaderIndices={[0]}
      />

      {/* Date Sheet */}
      <DateSheet
        visible={dateSheetVisible}
        onClose={() => setDateSheetVisible(false)}
        onConfirm={handlePresetChange}
        currentPreset={filters.preset}
      />

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
        races={races}
      />
    </SafeAreaView>
  );
}

// Map Screen Component
function MapScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  // Use shared filters from context
  const { filters } = useFilters();

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const racesData = await fetchRaces();
      setRaces(racesData);
    } catch (error) {
      console.error('Error loading races:', error);
      Alert.alert('Error', 'Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

        // Apply the same filtering logic as the List screen
      const getVisibleRaces = () => {
        let filtered = races.map(normalizeRace);

        // Date filtering
        if (filters.preset !== 'custom' && filters.preset !== 'next30') {
          const now = new Date();
          const todayStr = now.toLocaleDateString('en-CA');
          
          let startDateStr: string;
          let endDateStr: string;
          
          switch (filters.preset) {
        case 'today':
          startDateStr = todayStr;
          endDateStr = todayStr;
          break;
        case 'tomorrow':
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          startDateStr = tomorrow.toLocaleDateString('en-CA');
          endDateStr = startDateStr;
          break;
        case 'weekend':
          const dayOfWeek = now.getDay();
          const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          const saturday = new Date(now);
          saturday.setDate(now.getDate() + daysUntilSaturday);
          const sunday = new Date(now);
          sunday.setDate(now.getDate() + daysUntilSunday);
          startDateStr = saturday.toLocaleDateString('en-CA');
          endDateStr = sunday.toLocaleDateString('en-CA');
          break;
        case 'next7':
          const nextWeek = new Date(now);
          nextWeek.setDate(now.getDate() + 7);
          startDateStr = todayStr;
          endDateStr = nextWeek.toLocaleDateString('en-CA');
          break;
        default:
          const nextMonth = new Date(now);
          nextMonth.setDate(now.getDate() + 30);
          startDateStr = todayStr;
          endDateStr = nextMonth.toLocaleDateString('en-CA');
      }

      filtered = filtered.filter(race => {
        const raceDateStr = race.dateISO;
        let isInRange = false;
        
        if (filters.preset === 'today') {
          isInRange = raceDateStr === startDateStr;
        } else if (filters.preset === 'tomorrow') {
          isInRange = raceDateStr === startDateStr;
        } else if (filters.preset === 'weekend') {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
          console.log(`Weekend filter: Race ${race.name} on ${raceDateStr}, range ${startDateStr} to ${endDateStr}, inRange: ${isInRange}`);
        } else if (filters.preset === 'next7') {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
        } else {
          isInRange = raceDateStr >= startDateStr && raceDateStr <= endDateStr;
        }
        
        return isInRange;
      });
    }

    // Distance filtering
    if (filters.distances.length > 0) {
      filtered = filtered.filter(race =>
        race.distances?.some(distance => filters.distances.includes(distance as any))
      );
    }

    // Surface filtering
    if (filters.surface.length > 0) {
      filtered = filtered.filter(race =>
        race.surface && filters.surface.includes(race.surface as any)
      );
    }

    // Sort by date ascending
    return filtered.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
  };

  const visibleRaces = getVisibleRaces();

  return (
    <SafeAreaView style={styles.safeArea}>
      <RaceMap races={visibleRaces} />
    </SafeAreaView>
  );
}

// Main App Component
export default function App() {
  const [sharedFilters, setSharedFilters] = useState<FilterState>({
    preset: 'next30',
    distances: [],
    surface: [],
    useLocation: false,
    locationRadius: 25,
    city: 'all'
  });

  return (
    <FilterContext.Provider value={{ filters: sharedFilters, setFilters: setSharedFilters }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'List') {
                iconName = focused ? 'list' : 'list-outline';
              } else if (route.name === 'Map') {
                iconName = focused ? 'map' : 'map-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="List" component={ListStack} />
          <Tab.Screen name="Map" component={MapScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </FilterContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'underline',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
