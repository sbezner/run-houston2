import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { APP_VERSION, DB_VERSION } from "../config";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run Houston</Text>
      <Text style={styles.subtitle}>Race Discovery App</Text>

      <View style={styles.versionContainer}>
        <Text style={styles.versionLabel}>App Version:</Text>
        <Text style={styles.versionValue}>{APP_VERSION}</Text>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionLabel}>Database Version:</Text>
        <Text style={styles.versionValue}>{DB_VERSION}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Discover and explore running races in the Greater Houston area.
        </Text>
        <Text style={styles.infoText}>
          View upcoming races on a map or in a list, with details about each event.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minWidth: 200,
    // Enhanced shadows for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  versionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 12,
  },
  versionValue: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  infoContainer: {
    marginTop: 32,
    alignItems: "center",
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
});
