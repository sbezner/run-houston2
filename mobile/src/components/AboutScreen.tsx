import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { VERSION, getVersionDisplayString, getFullVersionInfo, ApiVersionInfo } from '../constants/version';
import { config } from '../config';

const AboutScreen: React.FC = () => {
  const [apiVersionInfo, setApiVersionInfo] = useState<ApiVersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`${config.backendUrl}${VERSION.API_PATH}/version`);
        if (response.ok) {
          const data = await response.json();
          setApiVersionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch version info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  const versionInfo = getFullVersionInfo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Run Houston</Text>
        <Text style={styles.version}>{getVersionDisplayString()}</Text>
        
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <View style={styles.versionGrid}>
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>App Version</Text>
              <Text style={styles.versionValue}>{versionInfo.app}</Text>
            </View>
            
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>Build Number</Text>
              <Text style={styles.versionValue}>{versionInfo.build}</Text>
            </View>
            
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>Database Version</Text>
              <Text style={styles.versionValue}>{versionInfo.db}</Text>
            </View>
            
            <View style={styles.versionItem}>
              <Text style={styles.versionLabel}>System Release</Text>
              <Text style={styles.versionValue}>{versionInfo.system}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading API version...</Text>
            </View>
          ) : apiVersionInfo ? (
            <View style={styles.apiVersionContainer}>
              <Text style={styles.apiVersionTitle}>API Information</Text>
              <View style={styles.versionGrid}>
                <View style={styles.versionItem}>
                  <Text style={styles.versionLabel}>API Version</Text>
                  <Text style={styles.versionValue}>{apiVersionInfo.api_version}</Text>
                </View>
                
                <View style={styles.versionItem}>
                  <Text style={styles.versionLabel}>API Path</Text>
                  <Text style={styles.versionValue}>{apiVersionInfo.api_path_major}</Text>
                </View>
                
                <View style={styles.versionItem}>
                  <Text style={styles.versionLabel}>Schema Version</Text>
                  <Text style={styles.versionValue}>{apiVersionInfo.schema_version}</Text>
                </View>
                
                <View style={styles.versionItem}>
                  <Text style={styles.versionLabel}>System Release</Text>
                  <Text style={styles.versionValue}>{apiVersionInfo.system_release}</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Unable to load API version information</Text>
          )}
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
  versionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  versionItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  versionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  apiVersionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  apiVersionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AboutScreen;
