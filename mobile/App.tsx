import { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, ActivityIndicator, StyleSheet, Linking, Alert } from "react-native";
import { API_BASE } from "./src/config";

type Race = {
  id: number;
  name: string;
  date: string;         // ISO date
  start_time: string;   // HH:MM:SS
  city: string | null;
  state: string | null;
  surface: string | null;
  kid_run: boolean | null;
  official_website_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function App() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/races`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Race[] = await res.json();
        setRaces(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        <Text>Check that your backend is running and API_BASE is correct.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Run Houston — Upcoming Races</Text>
      <FlatList
        data={races}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.title}>{item.name}</Text>
            <Text>{new Date(item.date).toDateString()} at {item.start_time?.slice(0,5)}</Text>
            <Text>{[item.city, item.state].filter(Boolean).join(", ") || "Houston area"}</Text>
            <Text>{[item.surface, item.kid_run ? "Kid run: Yes" : "Kid run: No"].filter(Boolean).join(" • ")}</Text>
            {item.official_website_url ? (
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL(item.official_website_url!).catch(() => Alert.alert("Could not open link"))
                }
              >
                Open race website
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No races found.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
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
  link: { color: "#1b73e8", marginTop: 6 }
});
