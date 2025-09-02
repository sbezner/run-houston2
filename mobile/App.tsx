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
import DateSheet from './src/components/DateSheet';
import { FilterSheet } from './src/components/FilterSheet';
import { RaceCard } from './src/components/RaceCard';
import RaceMap from './src/components/RaceMap';
import { fetchRaces, fetchRaceReports } from './src/api';
import AboutScreen from './src/components/AboutScreen';
import { ClubsScreen } from './src/screens/ClubsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import RaceReportScreen from './src/screens/RaceReportScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import { DateFilterProvider, useDateFilter } from './src/state/dateFilter';
import { filterRacesByDate } from './src/selectors/races';

// Create a context for sharing filters between screens
const FilterContext = createContext<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}>({
  filters: {
    preset: 'next30Days',
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
        name="RaceReport" 
        options={{ title: 'Race Report' }}
      >
        {(props) => <RaceReportScreen {...props} />}
      </Stack.Screen>
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
  const [hasReportByRaceId, setHasReportByRaceId] = useState<Record<string | number, boolean>>({});
  
  // Use shared filters from context
  const { filters, setFilters } = useFilters();
  
  // Use the new date filter state
  const { applied: dateFilter, labelForApplied } = useDateFilter();

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

  const handlePresetChange = (fromDate: string, toDate: string) => {
    setFilters(prev => ({
      ...prev,
      preset: 'custom' as any,
      dateFrom: fromDate,
      dateTo: toDate,
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
      preset: 'next30Days',
      distances: [],
      surface: [],
      useLocation: false,
      locationRadius: 25,
      city: 'all',
    });
  };

  const getSummaryText = (): string => {
    // Use the new date filter system for the summary text
    const dateLabel = labelForApplied();
    
    const parts = [dateLabel];
    const activeFilters = getActiveFilters();
    if (activeFilters.length > 0) {
      parts.push(...activeFilters);
    }
    return parts.join(' • ');
  };

  const getVisibleRaces = (): RaceVM[] => {
    // First, apply date filtering on the raw Race objects since the selector expects `date`/`start_time`
    let filteredRaw: Race[] = filterRacesByDate(races, dateFilter.range);

    // Then normalize for UI consumption
    let filtered: RaceVM[] = filteredRaw.map(normalizeRace);
    
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

  // Batch fetch all reports once to build race report availability map
  useEffect(() => {
    const buildReportMap = async () => {
      try {
        // Fetch all reports in batches to build the map
        let offset = 0;
        const limit = 100;
        const raceReportMap: Record<string | number, boolean> = {};
        
        while (true) {
          const res = await fetchRaceReports({ limit, offset });
          if (!res.items || res.items.length === 0) break;
          
          // Mark races as having reports
          res.items.forEach(report => {
            if (report.race_id) {
              raceReportMap[report.race_id] = true;
            }
          });
          
          offset += res.items.length;
          if (res.items.length < limit) break; // No more reports
        }
        
        setHasReportByRaceId(raceReportMap);
      } catch (error) {
        console.error('Error building report map:', error);
        // On error, show all buttons (optimistic approach)
        setHasReportByRaceId({});
      }
    };
    
    buildReportMap();
  }, []);

  const handleRacePress = (race: RaceVM) => {
    // Handle race selection - could open details or navigate to map
    // TODO: Implement race card interaction (e.g., open details modal)
  };

  const handleOpenReport = async (race: RaceVM) => {
    try {
      const raceIdNum = typeof race.id === 'string' ? parseInt(race.id, 10) : race.id;
      if (!raceIdNum || Number.isNaN(raceIdNum)) {
        navigation.navigate('Reports');
        return;
      }
      // Fetch up to 2 to decide between single-report open vs list view
      const res = await fetchRaceReports({ limit: 2, offset: 0, race_id: raceIdNum as number });
      const count = res.items?.length ?? 0;
      if (count === 1) {
        navigation.navigate('RaceReport', { report: res.items[0] });
        return;
      }
      // If 0 or multiple, show the list filtered to the race
      navigation.navigate('Reports', { race_id: raceIdNum, race_name: race.name });
    } catch (e) {
      // On any error, take the user to the reports list as a safe fallback
      navigation.navigate('Reports');
    }
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
        currentPreset={dateFilter.preset}
        activeFilterCount={getActiveFilterCount()}
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
                  <RaceCard
          race={item}
          onPress={() => handleRacePress(item)}
          hasReport={hasReportByRaceId[item.id] === true}
          onPressReport={() => handleOpenReport(item)}
          userLocation={coords}
        />
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
      />

      {/* Date Sheet */}
              <DateSheet
          visible={dateSheetVisible}
          onClose={() => setDateSheetVisible(false)}
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
function MapScreen({ navigation }: any) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasReportByRaceId, setHasReportByRaceId] = useState<Record<string | number, boolean>>({});
  // Use shared filters from context
  const { filters } = useFilters();
  // Use the new date filter state
  const { applied: dateFilter } = useDateFilter();
  const { coords } = useUserLocation();

  useEffect(() => {
    loadRaces();
  }, []);

  useEffect(() => {
    buildReportMap();
  }, [races]);

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

  const buildReportMap = async () => {
    if (races.length === 0) return;
    
    try {
      const reportMap: Record<string | number, boolean> = {};
      
      // Check each race for reports
      for (const race of races) {
        try {
          const raceIdNum = typeof race.id === 'string' ? parseInt(race.id, 10) : race.id;
          if (!raceIdNum || Number.isNaN(raceIdNum)) {
            reportMap[race.id] = false;
            continue;
          }
          
          const res = await fetchRaceReports({ limit: 1, offset: 0, race_id: raceIdNum as number });
          const count = res.items?.length ?? 0;
          reportMap[race.id] = count > 0;
        } catch (e) {
          reportMap[race.id] = false;
        }
      }
      
      setHasReportByRaceId(reportMap);
    } catch (error) {
      console.error('Error building report map:', error);
    }
  };

  const handleOpenReport = async (race: RaceVM) => {
    try {
      const raceIdNum = typeof race.id === 'string' ? parseInt(race.id, 10) : race.id;
      if (!raceIdNum || Number.isNaN(raceIdNum)) {
        // Navigate to List tab first, then to Reports
        navigation.navigate('List', { screen: 'Reports' });
        return;
      }
      // Fetch up to 2 to decide between single-report open vs list view
      const res = await fetchRaceReports({ limit: 2, offset: 0, race_id: raceIdNum as number });
      const count = res.items?.length ?? 0;
      if (count === 1) {
        // Navigate to List tab first, then to RaceReport
        navigation.navigate('List', { screen: 'RaceReport', params: { report: res.items[0] } });
        return;
      }
      // If 0 or multiple, show the list filtered to the race
      navigation.navigate('List', { screen: 'Reports', params: { race_id: raceIdNum, race_name: race.name } });
    } catch (e) {
      // On any error, take the user to the reports list as a safe fallback
      navigation.navigate('List', { screen: 'Reports' });
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
        // Apply date filtering on raw objects then normalize
        const filteredRaw = filterRacesByDate(races, dateFilter.range);
        let filtered = filteredRaw.map(normalizeRace);

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
      <RaceMap 
        races={visibleRaces} 
        userLocation={coords}
        hasReportByRaceId={hasReportByRaceId}
        onPressReport={handleOpenReport}
      />
    </SafeAreaView>
  );
}

// Main App Component
export default function App() {
  const [sharedFilters, setSharedFilters] = useState<FilterState>({
    preset: 'next30Days',
    distances: [],
    surface: [],
    useLocation: false,
    locationRadius: 25,
    city: 'all'
  });

  return (
    <DateFilterProvider>
      <FilterContext.Provider value={{ filters: sharedFilters, setFilters: setSharedFilters }}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                if (route.name === 'Community') {
                  return <Text style={{ fontSize: size, color }}>👥</Text>;
                }

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
            <Tab.Screen name="Community" component={CommunityScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FilterContext.Provider>
    </DateFilterProvider>
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
