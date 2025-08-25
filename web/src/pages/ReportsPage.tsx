import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { raceReports } from '../services/api';
import { RaceReport, RaceReportsResponse } from '../types';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<RaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<'created_at' | 'race_date'>('created_at');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [groupByRace, setGroupByRace] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response: RaceReportsResponse = await raceReports.list({
        q: searchQuery || undefined,
        order_by: orderBy,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit,
        offset,
        include_race: true
      });
      setReports(response.items);
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
  }, [searchQuery, orderBy, dateFrom, dateTo, offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchReports();
  };

  const handleReset = () => {
    setSearchQuery('');
    setOrderBy('created_at');
    setDateFrom('');
    setDateTo('');
    setOffset(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupedReports = groupByRace ? reports.reduce((acc, report) => {
    const raceName = report.race?.name || `Race ${report.race_id}`;
    if (!acc[raceName]) {
      acc[raceName] = [];
    }
    acc[raceName].push(report);
    return acc;
  }, {} as Record<string, RaceReport[]>) : null;

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
        <p style={{ fontSize: '18px', color: '#666' }}>
          {reports.length > 0 ? `Found ${total} race reports` : 'No race reports yet'}
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value as 'created_at' | 'race_date')}
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="created_at">Newest First</option>
              <option value="race_date">Race Date</option>
            </select>
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reset
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={groupByRace}
              onChange={(e) => setGroupByRace(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Group by race</span>
          </label>
        </div>
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
          {groupByRace && groupedReports ? (
            // Grouped by race
            Object.entries(groupedReports).map(([raceName, raceReports]) => (
              <div key={raceName} style={{ marginBottom: '30px' }}>
                <h2 style={{ 
                  fontSize: '24px', 
                  marginBottom: '15px', 
                  color: '#007AFF',
                  borderBottom: '2px solid #007AFF',
                  paddingBottom: '5px'
                }}>
                  {raceName}
                </h2>
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                  {raceReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Regular grid
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '15px',
              marginTop: '40px'
            }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{
                  backgroundColor: offset === 0 ? '#ccc' : '#007AFF',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: offset === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '16px', color: '#666' }}>
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                style={{
                  backgroundColor: offset + limit >= total ? '#ccc' : '#007AFF',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: offset + limit >= total ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
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
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '15px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 25px rgba(0,0,0,0.15)'
      }
    }}>
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
        
        {report.author_name && (
          <p style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            By {report.author_name}
          </p>
        )}
        
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
