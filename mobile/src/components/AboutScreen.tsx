import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const AboutScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Run Houston</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            Run Houston is your comprehensive guide to running events, clubs, and race reports in the Houston area. 
            Discover upcoming races, join local running clubs, and read race reports from fellow runners.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.feature}>🏃‍♂️ Race Listings</Text>
          <Text style={styles.feature}>🗺️ Interactive Maps</Text>
          <Text style={styles.feature}>🏆 Race Reports</Text>
          <Text style={styles.feature}>👥 Running Clubs</Text>
          <Text style={styles.feature}>📍 Distance & Directions</Text>
          <Text style={styles.feature}>🏠 Full Address Display</Text>
          <Text style={styles.feature}>🎯 Enhanced Race Cards</Text>
          <Text style={styles.feature}>🔍 Advanced Filtering</Text>
          <Text style={styles.feature}>👥 Community Hub (Coming Soon)</Text>
          <Text style={styles.feature}>📱 Mobile Optimized</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  version: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'justify',
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
});

export default AboutScreen;
