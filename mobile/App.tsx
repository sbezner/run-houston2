import { useEffect, useState } from "react";
import {
  SafeAreaView,
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

export default function App() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "map" | "about">("list");
  const [refreshing, setRefreshing] = useState(false); // 1. Add refreshing state

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
  const in30 = new Date(today);
  in30.setDate(today.getDate() + 30);

  const visibleRaces = races
    .filter((r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= in30;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text>Loading races…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
        <Text>Check that your backend is running and your device can reach it.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Run Houston — Upcoming Races</Text>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setMode("list")}
          style={[styles.toggleBtn, mode === "list" ? styles.toggleActive : styles.toggleIdle]}
        >
          <Text style={[styles.toggleText, mode === "list" ? styles.toggleTextActive : styles.toggleTextIdle]}>
            List
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("map")}
          style={[styles.toggleBtn, mode === "map" ? styles.toggleActive : styles.toggleIdle]}
        >
          <Text style={[styles.toggleText, mode === "map" ? styles.toggleTextActive : styles.toggleTextIdle]}>
            Map
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("about")}
          style={[styles.toggleBtn, mode === "about" ? styles.toggleActive : styles.toggleIdle]}
        >
          <Text style={[styles.toggleText, mode === "about" ? styles.toggleTextActive : styles.toggleTextIdle]}>
            About
          </Text>
        </Pressable>
      </View>

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
                  <Text style={styles.raceDate}>
                    {new Date(item.date).toDateString()}
                    {item.start_time ? ` at ${item.start_time.slice(0, 5)}` : ""}
                  </Text>
                  
                  <Text style={styles.raceLocation}>
                    {[item.city, item.state].filter(Boolean).join(", ") || "Houston area"}
                  </Text>
                  
                  <Text style={styles.raceDetails}>
                    {[item.surface || undefined, item.kid_run ? "Kid run: Yes" : "Kid run: No"]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                </View>
                
                {item.official_website_url ? (
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL(item.official_website_url!).catch(() =>
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
          <RaceMap />
        ) : (
          <AboutScreen />
        )}
      </View>
    </SafeAreaView>
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
  raceDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5f6368",
    marginBottom: 4,
  },
  raceLocation: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  raceDetails: {
    fontSize: 14,
    color: "#5f6368",
  },
});
