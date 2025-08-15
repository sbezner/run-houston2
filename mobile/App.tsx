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

export default function App() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "map">("list");
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
                <Text>
                  {new Date(item.date).toDateString()}
                  {item.start_time ? ` at ${item.start_time.slice(0, 5)}` : ""}
                </Text>
                <Text>{[item.city, item.state].filter(Boolean).join(", ") || "Houston area"}</Text>
                <Text>
                  {[item.surface || undefined, item.kid_run ? "Kid run: Yes" : "Kid run: No"]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
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
        ) : (
          <RaceMap />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "600", padding: 16 },
  row: { paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  sep: { height: 1, backgroundColor: "#eee", marginLeft: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 8 },
  error: { color: "red", fontWeight: "600" },
  link: { color: "#1b73e8", marginTop: 6 },

  toggleRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  toggleActive: { backgroundColor: "#222" },
  toggleIdle: { backgroundColor: "#eee" },
  toggleText: { fontSize: 14 },
  toggleTextActive: { color: "#fff" },
  toggleTextIdle: { color: "#111" },
});
