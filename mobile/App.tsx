import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
  Pressable,
} from "react-native";
import { Race } from "./src/types";
import { fetchRaces } from "./src/api";
import RaceMap from "./src/components/RaceMap";
import AboutScreen from "./src/components/AboutScreen";
import { ClubsScreen } from "./src/screens/ClubsScreen";

// Helper function to capitalize first letter of surface type and add "Surface"
const capitalizeSurface = (surface: string | null | undefined): string => {
  if (!surface) return '';
  return surface.charAt(0).toUpperCase() + surface.slice(1) + ' Surface';
};

// Helper function to format time with AM/PM
const formatTimeWithAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  // Extract hours and minutes from the time string (assuming format like "14:30:00")
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  // Convert to 12-hour format
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  // Format with leading zero for minutes if needed
  const displayMinute = minute.toString().padStart(2, '0');
  
  return `${displayHour}:${displayMinute} ${period}`;
};

// Helper function to normalize URLs and ensure they have proper protocol
const normalizeURL = (url: string): string => {
  if (!url) return '';
  
  // If URL doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  
  return url;
};

export default function App() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "map" | "about" | "clubs">("list");
  const [refreshing, setRefreshing] = useState(false); // 1. Add refreshing state
  const [timeFilter, setTimeFilter] = useState<"30" | "60" | "90" | "all">("30"); // Time filter state

  // 2. Create reload function
  const reload = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const rs = await fetchRaces();
      setRaces(rs);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // 3. Use reload in initial load
  useEffect(() => {
    reload();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight

  // Calculate filter date based on selected time range
  const getFilterDate = () => {
    switch (timeFilter) {
      case "30":
        const in30 = new Date(today);
        in30.setDate(today.getDate() + 30);
        return in30;
      case "60":
        const in60 = new Date(today);
        in60.setDate(today.getDate() + 60);
        return in60;
      case "90":
        const in90 = new Date(today);
        in90.setDate(today.getDate() + 90);
        return in90;
      case "all":
        return null; // No upper limit
      default:
        return null;
    }
  };

  const filterDate = getFilterDate();

  const visibleRaces = races
    .filter((r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      if (filterDate) {
        return d >= today && d <= filterDate;
      }
      return d >= today; // Show all future races
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading races…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
        <Text>Check that your backend is running and your device can reach it.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {mode === "about" ? "About Run Houston" : "Run Houston — Upcoming Races"}
      </Text>

      {/* Time Filter Chips - Only show for List and Map modes */}
      {mode !== "about" && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Show races in:</Text>
          <View style={styles.filterChips}>
            {(["30", "60", "90", "all"] as const).map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterChip,
                  timeFilter === filter ? styles.filterChipActive : styles.filterChipInactive
                ]}
                onPress={() => setTimeFilter(filter)}
              >
                <Text style={[
                  styles.filterChipText,
                  timeFilter === filter ? styles.filterChipTextActive : styles.filterChipTextInactive
                ]}>
                  {filter === "all" ? "All" : `${filter} Days`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {mode === "list" ? (
          <FlatList
            data={visibleRaces}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.title}>{item.name}</Text>
                
                <View style={styles.raceInfo}>
                  <Text style={styles.raceDetails}>
                   📅 {new Date(item.date).toDateString()}
                    {item.start_time ? ` at ${formatTimeWithAMPM(item.start_time)}` : ""}
                  </Text>
                  
                  <Text style={styles.raceDetails}>
                  📍 {[item.city, item.state].filter(Boolean).join(", ") || "Houston area"}
                  </Text>
                  
                  {item.surface && (
                    <Text style={styles.raceDetails}>
                      🏃 {capitalizeSurface(item.surface)}
                    </Text>
                  )}
                  
                  <Text style={styles.raceDetails}>
                    👶 Kid Run: {item.kid_run ? "Yes" : "No"}
                  </Text>
                </View>
                
                {item.official_website_url ? (
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL(normalizeURL(item.official_website_url!)).catch(() =>
                        Alert.alert("Could not open link")
                      )
                    }
                  >
                    Open race website
                  </Text>
                ) : null}
              </View>
            )}
            ListEmptyComponent={<Text style={{ padding: 16 }}>No races found.</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshing={refreshing} // 4. Add refreshing prop
            onRefresh={reload}      // 5. Add onRefresh prop
          />
        ) : mode === "map" ? (
          <RaceMap races={visibleRaces} />
        ) : mode === "clubs" ? (
          <ClubsScreen />
        ) : (
          <AboutScreen />
        )}
      </View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <Pressable
          onPress={() => setMode("list")}
          style={[styles.bottomNavTab, mode === "list" ? styles.bottomNavTabActive : styles.bottomNavTabInactive]}
        >
          <Text style={[styles.bottomNavText, mode === "list" ? styles.bottomNavTextActive : styles.bottomNavTextInactive]}>
            📋 List
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("map")}
          style={[styles.bottomNavTab, mode === "map" ? styles.bottomNavTabActive : styles.bottomNavTabInactive]}
        >
          <Text style={[styles.bottomNavText, mode === "map" ? styles.bottomNavTextActive : styles.bottomNavTextInactive]}>
            🗺️ Map
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("clubs")}
          style={[styles.bottomNavTab, mode === "clubs" ? styles.bottomNavTabActive : styles.bottomNavTabInactive]}
        >
          <Text style={[styles.bottomNavText, mode === "clubs" ? styles.bottomNavTextActive : styles.bottomNavTextInactive]}>
            🏃‍♂️ Clubs
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("about")}
          style={[styles.bottomNavTab, mode === "about" ? styles.bottomNavTabActive : styles.bottomNavTabInactive]}
        >
          <Text style={[styles.bottomNavText, mode === "about" ? styles.bottomNavTextActive : styles.bottomNavTextInactive]}>
            ℹ️ About
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" // Light background for better contrast
  },
  header: { 
    fontSize: 20, 
    fontWeight: "700", 
    padding: 20, 
    paddingBottom: 16,
    color: "#333",
    textAlign: "center",
    backgroundColor: "#fff",
    // Add subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    // Enhanced shadows for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 8,
    color: "#333",
    lineHeight: 22,
  },
  sep: { 
    height: 8, // Increased spacing between cards
    backgroundColor: "transparent", // Remove separator line
    marginLeft: 16 
  },
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 24, 
    gap: 16,
    backgroundColor: "#f8f9fa",
  },
  error: { 
    color: "#dc3545", 
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  link: { 
    color: "#007AFF", 
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  toggleRow: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    gap: 8, 
    marginBottom: 8,
    backgroundColor: "#fff",
    // Add subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: { 
    backgroundColor: "#007AFF",
    // Enhanced shadow for active state
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toggleIdle: { 
    backgroundColor: "#f1f3f4",
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  toggleText: { 
    fontSize: 14,
    fontWeight: "600",
  },
  toggleTextActive: { 
    color: "#fff" 
  },
  toggleTextIdle: { 
    color: "#5f6368" 
  },

  raceInfo: {
    marginTop: 8,
    marginBottom: 12,
  },
  

  raceDetails: {
    fontSize: 14,
    color: "#5f6368",
  },
  // Filter styles
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterChipInactive: {
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  filterChipTextInactive: {
    color: "#6c757d",
  },
  // Bottom navigation styles
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e1e5e9",
    paddingBottom: 20, // Extra padding for safe area
    paddingTop: 12,
    // Enhanced shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bottomNavTabActive: {
    // Active state styling
  },
  bottomNavTabInactive: {
    // Inactive state styling
  },
  bottomNavText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomNavTextActive: {
    color: "#007AFF",
  },
  bottomNavTextInactive: {
    color: "#8e8e93",
  },
});
