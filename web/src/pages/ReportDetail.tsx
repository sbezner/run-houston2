import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { raceReports } from '../services/api';
import type { RaceReport } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<RaceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await raceReports.getById(parseInt(id), true);
        setReport(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering for MVP
    return markdown
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index} style={{ fontSize: '24px', margin: '20px 0 10px 0', color: '#333' }}>{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} style={{ fontSize: '28px', margin: '20px 0 15px 0', color: '#333' }}>{line.substring(2)}</h1>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={index} style={{ fontWeight: 'bold' }}>{line.substring(2, line.length - 2)}</strong>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} style={{ margin: '10px 0', lineHeight: '1.6', color: '#333' }}>{line}</p>;
      });
  };

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>📰 Race Report</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading report...</p>
        </div>
        <Loading />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>📰 Race Report</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Error loading report</p>
        </div>
        <Alert message={error || 'Report not found'} type="error" />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            to="/race_reports"
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          >
            Back to Reports
          </Link>
        </div>
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
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link
          to="/race_reports"
          style={{
            color: '#007AFF',
            textDecoration: 'none',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '20px'
          }}
        >
          ← Back to Race Reports
        </Link>
        
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>
          {report.title}
        </h1>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '20px',
          alignItems: 'center',
          marginBottom: '20px',
          fontSize: '16px',
          color: '#666'
        }}>
          <span>
            <strong>Race:</strong> {report.race?.name || `Race ${report.race_id}`}
          </span>
          <span>
            <strong>Race Date:</strong> {formatDate(report.race_date)}
          </span>
          {report.author_name && (
            <span>
              <strong>Author:</strong> {report.author_name}
            </span>
          )}
          <span>
            <strong>Published:</strong> {formatDate(report.created_at)}
          </span>
        </div>
      </div>

      {/* Photo Gallery */}
      {report.photos.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>Photos</h3>
          <div style={{ 
            display: 'grid', 
            gap: '15px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
          }}>
            {report.photos.map((photo, index) => (
              <div key={index} style={{ 
                borderRadius: '10px', 
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={photo}
                  alt={`Race photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Content */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        lineHeight: '1.6'
      }}>
        <div style={{ fontSize: '16px' }}>
          {renderMarkdown(report.content_md)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px'
      }}>
        <Link
          to="/race_reports"
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          View All Reports
        </Link>
      </div>
    </div>
  );
};
