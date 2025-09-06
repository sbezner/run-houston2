import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { config } from '../config';

interface VersionMetrics {
  version_usage: Record<string, number>;
  total_api_calls: number;
  total_errors: number;
  uptime_seconds: number;
  last_deployment: string | null;
}

interface PerformanceMetrics {
  average_response_time: number;
  slowest_endpoints: Array<{
    endpoint: string;
    average_time: number;
  }>;
  total_requests: number;
}

interface DetailedHealth {
  status: string;
  api_version: string;
  schema_version: string;
  system_release: string;
  uptime_seconds: number;
  total_api_calls: number;
  total_errors: number;
  average_response_time_ms: number;
  last_deployment: string | null;
  version_usage: Record<string, number>;
  error_breakdown: Record<string, number>;
  api_call_breakdown: Record<string, number>;
}

const MonitoringScreen: React.FC = () => {
  const [versionMetrics, setVersionMetrics] = useState<VersionMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [detailedHealth, setDetailedHealth] = useState<DetailedHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setError(null);

      // Fetch all monitoring data in parallel
      const [versionResponse, performanceResponse, healthResponse] = await Promise.all([
        fetch(`${config.backendUrl}/api/v1/monitoring/version-metrics`),
        fetch(`${config.backendUrl}/api/v1/monitoring/performance`),
        fetch(`${config.backendUrl}/api/v1/monitoring/health-detailed`)
      ]);

      if (!versionResponse.ok || !performanceResponse.ok || !healthResponse.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [versionData, performanceData, healthData] = await Promise.all([
        versionResponse.json(),
        performanceResponse.json(),
        healthResponse.json()
      ]);

      setVersionMetrics(versionData);
      setPerformanceMetrics(performanceData);
      setDetailedHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonitoringData();
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading monitoring data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Monitoring Data</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>System Monitoring</Text>
        <Text style={styles.subtitle}>Real-time system health and performance metrics</Text>
      </View>

      {detailedHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Status:</Text>
              <Text style={[
                styles.healthValue,
                { color: detailedHealth.status === 'healthy' ? '#28a745' : '#dc3545' }
              ]}>
                {detailedHealth.status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>API Version:</Text>
              <Text style={styles.healthValue}>{detailedHealth.api_version}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Schema Version:</Text>
              <Text style={styles.healthValue}>{detailedHealth.schema_version}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>System Release:</Text>
              <Text style={styles.healthValue}>{detailedHealth.system_release}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Uptime:</Text>
              <Text style={styles.healthValue}>{formatUptime(detailedHealth.uptime_seconds)}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Total API Calls:</Text>
              <Text style={styles.healthValue}>{formatNumber(detailedHealth.total_api_calls)}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Total Errors:</Text>
              <Text style={styles.healthValue}>{formatNumber(detailedHealth.total_errors)}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Avg Response Time:</Text>
              <Text style={styles.healthValue}>{detailedHealth.average_response_time_ms.toFixed(2)}ms</Text>
            </View>
          </View>
        </View>
      )}

      {versionMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version Usage</Text>
          <View style={styles.metricsGrid}>
            {Object.entries(versionMetrics.version_usage).map(([version, count]) => (
              <View key={version} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{version}:</Text>
                <Text style={styles.metricValue}>{formatNumber(count)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {performanceMetrics && performanceMetrics.slowest_endpoints.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Average Response Time:</Text>
              <Text style={styles.performanceValue}>{performanceMetrics.average_response_time.toFixed(2)}ms</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Total Requests:</Text>
              <Text style={styles.performanceValue}>{formatNumber(performanceMetrics.total_requests)}</Text>
            </View>
          </View>
          
          <Text style={styles.subsectionTitle}>Slowest Endpoints</Text>
          <View style={styles.endpointList}>
            {performanceMetrics.slowest_endpoints.map((endpoint, index) => (
              <View key={index} style={styles.endpointItem}>
                <Text style={styles.endpointName}>{endpoint.endpoint}</Text>
                <Text style={styles.endpointTime}>{endpoint.average_time.toFixed(2)}ms</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {detailedHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Breakdown</Text>
          <View style={styles.errorGrid}>
            {Object.entries(detailedHealth.error_breakdown).map(([error, count]) => (
              <View key={error} style={styles.errorItem}>
                <Text style={styles.errorLabel}>{error}:</Text>
                <Text style={styles.errorValue}>{formatNumber(count)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {detailedHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Call Breakdown</Text>
          <View style={styles.apiGrid}>
            {Object.entries(detailedHealth.api_call_breakdown).map(([endpoint, count]) => (
              <View key={endpoint} style={styles.apiItem}>
                <Text style={styles.apiLabel}>{endpoint}:</Text>
                <Text style={styles.apiValue}>{formatNumber(count)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 12,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  healthLabel: {
    fontWeight: '600',
    color: '#495057',
    fontSize: 14,
  },
  healthValue: {
    color: '#212529',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  metricLabel: {
    fontWeight: '500',
    color: '#495057',
    fontSize: 14,
  },
  metricValue: {
    color: '#212529',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  performanceItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  performanceLabel: {
    fontWeight: '600',
    color: '#495057',
    fontSize: 14,
  },
  performanceValue: {
    color: '#212529',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  endpointList: {
    flexDirection: 'column',
  },
  endpointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  endpointName: {
    fontFamily: 'monospace',
    color: '#495057',
    fontSize: 14,
    flex: 1,
  },
  endpointTime: {
    color: '#dc3545',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  errorItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  errorLabel: {
    fontWeight: '500',
    color: '#495057',
    fontSize: 14,
  },
  errorValue: {
    color: '#dc3545',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  apiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  apiItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  apiLabel: {
    fontWeight: '500',
    color: '#495057',
    fontFamily: 'monospace',
    fontSize: 14,
    flex: 1,
  },
  apiValue: {
    color: '#212529',
    fontFamily: 'monospace',
    fontSize: 14,
  },
});

export default MonitoringScreen;
