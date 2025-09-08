import React, { useState, useEffect } from 'react';
import { config } from "@shared/config";

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

const MonitoringPage: React.FC = () => {
  const [versionMetrics, setVersionMetrics] = useState<VersionMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [detailedHealth, setDetailedHealth] = useState<DetailedHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all monitoring data in parallel
        const [versionResponse, performanceResponse, healthResponse] = await Promise.all([
          fetch(`${config.API_BASE}${config.API_PATH}/monitoring/version-metrics`),
          fetch(`${config.API_BASE}${config.API_PATH}/monitoring/performance`),
          fetch(`${config.API_BASE}${config.API_PATH}/monitoring/health-detailed`)
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
      }
    };

    fetchMonitoringData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2>Error Loading Monitoring Data</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>System Monitoring Dashboard</h1>
        <p>Real-time system health and performance metrics</p>
      </div>

      {detailedHealth && (
        <div style={styles.section}>
          <h2>System Health</h2>
          <div style={styles.healthGrid}>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Status:</span>
              <span style={{
                ...styles.healthValue,
                color: detailedHealth.status === 'healthy' ? '#28a745' : '#dc3545'
              }}>
                {detailedHealth.status.toUpperCase()}
              </span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>API Version:</span>
              <span style={styles.healthValue}>{detailedHealth.api_version}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Schema Version:</span>
              <span style={styles.healthValue}>{detailedHealth.schema_version}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>System Release:</span>
              <span style={styles.healthValue}>{detailedHealth.system_release}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Uptime:</span>
              <span style={styles.healthValue}>{formatUptime(detailedHealth.uptime_seconds)}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Total API Calls:</span>
              <span style={styles.healthValue}>{formatNumber(detailedHealth.total_api_calls)}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Total Errors:</span>
              <span style={styles.healthValue}>{formatNumber(detailedHealth.total_errors)}</span>
            </div>
            <div style={styles.healthItem}>
              <span style={styles.healthLabel}>Avg Response Time:</span>
              <span style={styles.healthValue}>{detailedHealth.average_response_time_ms.toFixed(2)}ms</span>
            </div>
          </div>
        </div>
      )}

      {versionMetrics && (
        <div style={styles.section}>
          <h2>Version Usage</h2>
          <div style={styles.metricsGrid}>
            {Object.entries(versionMetrics.version_usage).map(([version, count]) => (
              <div key={version} style={styles.metricItem}>
                <span style={styles.metricLabel}>{version}:</span>
                <span style={styles.metricValue}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {performanceMetrics && performanceMetrics.slowest_endpoints.length > 0 && (
        <div style={styles.section}>
          <h2>Performance Metrics</h2>
          <div style={styles.performanceGrid}>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Average Response Time:</span>
              <span style={styles.performanceValue}>{performanceMetrics.average_response_time.toFixed(2)}ms</span>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Total Requests:</span>
              <span style={styles.performanceValue}>{formatNumber(performanceMetrics.total_requests)}</span>
            </div>
          </div>
          
          <h3>Slowest Endpoints</h3>
          <div style={styles.endpointList}>
            {performanceMetrics.slowest_endpoints.map((endpoint, index) => (
              <div key={index} style={styles.endpointItem}>
                <span style={styles.endpointName}>{endpoint.endpoint}</span>
                <span style={styles.endpointTime}>{endpoint.average_time.toFixed(2)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailedHealth && (
        <div style={styles.section}>
          <h2>Error Breakdown</h2>
          <div style={styles.errorGrid}>
            {Object.entries(detailedHealth.error_breakdown).map(([error, count]) => (
              <div key={error} style={styles.errorItem}>
                <span style={styles.errorLabel}>{error}:</span>
                <span style={styles.errorValue}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailedHealth && (
        <div style={styles.section}>
          <h2>API Call Breakdown</h2>
          <div style={styles.apiGrid}>
            {Object.entries(detailedHealth.api_call_breakdown).map(([endpoint, count]) => (
              <div key={endpoint} style={styles.apiItem}>
                <span style={styles.apiLabel}>{endpoint}:</span>
                <span style={styles.apiValue}>{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e9ecef'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007AFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    color: '#dc3545'
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  section: {
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  healthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  healthLabel: {
    fontWeight: 'bold',
    color: '#495057'
  },
  healthValue: {
    color: '#212529',
    fontFamily: 'monospace'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  metricLabel: {
    fontWeight: '500',
    color: '#495057'
  },
  metricValue: {
    color: '#212529',
    fontFamily: 'monospace'
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  performanceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  performanceLabel: {
    fontWeight: 'bold',
    color: '#495057'
  },
  performanceValue: {
    color: '#212529',
    fontFamily: 'monospace'
  },
  endpointList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  endpointItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  endpointName: {
    fontFamily: 'monospace',
    color: '#495057'
  },
  endpointTime: {
    color: '#dc3545',
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  errorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  errorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  errorLabel: {
    fontWeight: '500',
    color: '#495057'
  },
  errorValue: {
    color: '#dc3545',
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  apiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '10px'
  },
  apiItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  apiLabel: {
    fontWeight: '500',
    color: '#495057',
    fontFamily: 'monospace'
  },
  apiValue: {
    color: '#212529',
    fontFamily: 'monospace'
  }
};

export default MonitoringPage;
