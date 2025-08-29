import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { raceReports } from '../services/api';
import type { RaceReport, RaceReportsResponse } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const response: RaceReportsResponse = await raceReports.list({
        order_by: 'created_at',
        limit,
        offset,
        include_race: true
      });
      
      // If this is the first load (offset === 0), replace reports
      // If loading more (offset > 0), append to existing reports
      if (offset === 0) {
        setReports(response.items);
      } else {
        setReports(prevReports => [...prevReports, ...response.items]);
      }
      
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [offset]);

  const handleLoadMore = () => {
    setOffset(offset + limit);
  };

  // Removed grouping functionality - always show in simple grid

  if (loading && reports.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>📰 Race Reports</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading reports...</p>
        </div>
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>📰 Race Reports</h1>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>
          Ordered by creation date (newest first)
        </p>
      </div>



      {error && (
        <Alert message={error} type="error" />
      )}

      {reports.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#007AFF' }}>No Race Reports Yet</h2>
          <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
            Check back soon for race reports and insights from recent events!
          </p>
        </div>
      ) : (
        <div>
          {/* Simple grid layout */}
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          {/* Load More Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', color: '#666' }}>
                Showing {reports.length} of {total} reports
              </p>
              {total > offset + limit ? (
                <button
                  onClick={handleLoadMore}
                  style={{
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Load More Reports
                </button>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic' }}>
                  All reports loaded
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Report Card Component
const ReportCard: React.FC<{ report: RaceReport }> = ({ report }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="report-card">
      {/* Thumbnail */}
      {report.photos.length > 0 && (
        <div style={{ 
          height: '200px', 
          backgroundImage: `url(${report.photos[0]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid #eee'
        }} />
      )}
      
      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          marginBottom: '10px', 
          color: '#333',
          lineHeight: '1.3'
        }}>
          {report.title}
        </h3>
        
        {/* Author field removed */}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>Race: {report.race?.name || `Race ${report.race_id}`}</span>
          <span>{formatDate(report.race_date)}</span>
        </div>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#666',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {report.content_md.length > 150 
            ? `${report.content_md.substring(0, 150)}...` 
            : report.content_md
          }
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {formatDate(report.created_at)}
          </span>
          <Link
            to={`/race_reports/${report.id}`}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
};

// Add CSS styles for the report card
const styles = `
  .report-card {
    background-color: white;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  
  .report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0,0,0,0.15);
  }
`;

// Inject styles into the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
