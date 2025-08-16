import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Text, Linking, Pressable } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { fetchRaces } from "../api";
import type { Race } from "../types";
import { MaterialIcons } from "@expo/vector-icons";

const HOUSTON_REGION = {
  latitude: 29.7604,
  longitude: -95.3698,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  recenterBtn: {
    position: "absolute",
    bottom: 32,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    // Enhanced shadows for better depth
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Add border for better definition
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  recenterText: {
    color: "#007AFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: "#007AFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
  },
  calloutContainer: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    width: 260,
    // Add subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutTitle: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 16,
    color: "#333",
  },
  calloutDate: {
    marginBottom: 6,
    fontSize: 14,
    color: "#5f6368",
    fontWeight: "500",
  },
  calloutLocation: {
    marginBottom: 8,
    fontSize: 14,
    color: "#333",
  },
  calloutLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default function RaceMap() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  const fitAllOrHouston = () => {
    if (mapRef.current && races.length > 0) {
      mapRef.current.fitToCoordinates(
        races.map((r) => ({ latitude: r.latitude, longitude: r.longitude })),
        { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
      );
    } else {
      mapRef.current?.animateToRegion(HOUSTON_REGION, 300);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchRaces()
      .then((rs) => {
        if (!alive) return;
        setRaces(rs);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Fit the camera to all pins once markers are available
  useEffect(() => {
    if (!mapRef.current || races.length < 1) return;
    const ids = races.map((r) => `race-${r.id}`);
    // Small timeout helps ensure markers are on the map before fitting
    const t = setTimeout(() => {
      mapRef.current?.fitToSuppliedMarkers(ids, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [races]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map…</Text>
      </View>
    );
  }

  if (races.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Races Found</Text>
        <Text style={styles.emptyText}>No races with map locations yet.</Text>
        <Text style={styles.emptySubtext}>Check back later for upcoming races!</Text>
      </View>
    );
  }
    
 
  
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={HOUSTON_REGION}
      >
        {races.map((r) => (
          <Marker
            key={r.id}
            identifier={`race-${r.id}`}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            title={r.name}
            description={new Date(r.date).toLocaleDateString()}
          >
            <Callout
              onPress={() => {
                if (r.official_website_url) {
                  Linking.openURL(r.official_website_url).catch(() => {});
                }
              }}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{r.name}</Text>
                <Text style={styles.calloutDate}>
                  {new Date(r.date).toDateString()}
                  {r.start_time ? ` at ${r.start_time.slice(0, 5)}` : ""}
                </Text>
                <Text style={styles.calloutLocation}>
                  {[r.city, r.state].filter(Boolean).join(", ") || "Houston area"}
                </Text>
                {r.official_website_url ? (
                  <Text style={styles.calloutLink}>
                    Tap to open website
                  </Text>
                ) : null}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <Pressable
        style={styles.recenterBtn}
        onPress={fitAllOrHouston}
        accessibilityLabel="Recenter map on Houston"
      >
        <Text style={styles.recenterText}>Recenter</Text>
      </Pressable>
    </View>
  );
}
