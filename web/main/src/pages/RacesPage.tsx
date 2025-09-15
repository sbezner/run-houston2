import React from 'react';

import { useRaces } from "@shared/hooks/useRaces";
import { races as racesApi } from "@shared/services/api";
import { capitalizeSurface } from "@shared/utils/formatting";
import { Loading } from "@shared/components/Loading";
import { Alert } from "@shared/components/Alert";

// Drawer component removed - all race information now displayed on cards

export const FilterChip: React.FC<{ label: string; onClear: () => void }> = ({ label, onClear }) => (
  <span style={{ 
    display:'inline-flex', 
    alignItems:'center', 
    gap:8, 
    padding:'8px 12px', 
    background:'#ffffff', 
    color:'#475569', 
    border:'1px solid #e2e8f0', 
    borderRadius:8,
    fontWeight: '500',
    fontSize: '13px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  }}>
    {label}
    <button 
      onClick={onClear} 
      aria-label={`Clear ${label}`} 
      style={{ 
        border:'none', 
        background:'#f1f5f9', 
        cursor:'pointer', 
        color:'#64748b',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: '600',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#e2e8f0';
        e.currentTarget.style.color = '#475569';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f1f5f9';
        e.currentTarget.style.color = '#64748b';
      }}
    >
      ×
    </button>
  </span>
);

// Helper function to calculate weekend date range
const getWeekendRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until Saturday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  
  // Sunday is the day after Saturday
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    from: formatDate(saturday),
    to: formatDate(sunday)
  };
};

export const RacesPage: React.FC = () => {
  const { racesLoading, error } = useRaces();
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [qInput, setQInput] = React.useState('');
  const [city, setCity] = React.useState('');
  const [distanceCategory, setDistanceCategory] = React.useState('');
  const [surface, setSurface] = React.useState('');
  const [kidFriendly, setKidFriendly] = React.useState<string>('');
  const [sort, setSort] = React.useState('date_asc');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  // Removed drawer functionality - all info now on cards
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [density, setDensity] = React.useState<'compact' | 'comfortable'>('compact');
  const [isWide, setIsWide] = React.useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1280 : false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [initialLoad, setInitialLoad] = React.useState(true);
  
  // Arc-inspired sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [activeSpace, setActiveSpace] = React.useState<'all' | 'upcoming' | 'thisWeek' | 'thisMonth' | 'thisWeekend'>('all');
  // Split view removed - no longer needed without compare functionality

  const fetch = React.useCallback(async () => {
    setLoading(true);
    try {
      // Handle weekend filter
      let weekendDateFrom = dateFrom;
      let weekendDateTo = dateTo;
      
      if (activeSpace === 'thisWeekend') {
        const weekendRange = getWeekendRange();
        weekendDateFrom = weekendRange.from;
        weekendDateTo = weekendRange.to;
      }
      
      const data = await racesApi.list({ 
        q, 
        city, 
        distanceCategory, 
        surface, 
        sort, 
        page, 
        pageSize, 
        dateFrom: weekendDateFrom || undefined, 
        dateTo: weekendDateTo || undefined, 
        kidFriendly: kidFriendly === '' ? undefined as any : kidFriendly === 'true' 
      });
      const incoming = (data.items ?? data) as any[];
      if (page === 1) {
        setItems(incoming);
      } else {
        setItems(prev => {
          const existing = new Map(prev.map(r => [r.id, r]));
          for (const r of incoming) existing.set(r.id, r);
          return Array.from(existing.values());
        });
      }
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      // ignore here; existing Alert path handles errors via other hook when used
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [q, city, distanceCategory, surface, sort, page, pageSize, kidFriendly, dateFrom, dateTo, activeSpace]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  // Debounce search input to keep focus and avoid flicker
  React.useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setQ(qInput);
    }, 250);
    return () => clearTimeout(id);
  }, [qInput]);

  // wide layout detection
  React.useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // hero collapse on scroll - removed as hero section was simplified

  // keyboard shortcuts: '/' to focus search, Esc to blur
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // infinite scroll via sentinel
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading && items.length < total) {
        setPage(p => p + 1);
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, items.length, total]);

  // Space-based filtering
  React.useEffect(() => {
    const now = new Date();
    const thisWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    switch (activeSpace) {
      case 'upcoming':
        setDateFrom(now.toISOString().slice(0, 10));
        break;
      case 'thisWeek':
        setDateFrom(now.toISOString().slice(0, 10));
        setDateTo(thisWeek.toISOString().slice(0, 10));
        break;
      case 'thisMonth':
        setDateFrom(now.toISOString().slice(0, 10));
        setDateTo(thisMonth.toISOString().slice(0, 10));
        break;
      default:
        setDateFrom('');
        setDateTo('');
    }
  }, [activeSpace]);

  if ((racesLoading || loading) && initialLoad) {
    return (
      <div style={{ 
        width: '100vw', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
        margin: 0,
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading races...</p>
        </div>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Error loading races</p>
        </div>
        <Alert message={error} type="error" />
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => fetch()}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Arc-inspired Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '240px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 20,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1e293b',
              letterSpacing: '-0.025em'
            }}>
              🏃‍♂️ Run Houston
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Filters Navigation */}
        <div style={{ padding: '12px', flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          {/* Time-based Views */}
          <div style={{ marginBottom: '24px' }}>
            {!sidebarCollapsed && (
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#64748b', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                padding: '0 12px'
              }}>
                Time Views
              </div>
            )}
            {[
              { key: 'all', label: 'All Races', icon: '🏃‍♂️' },
              { key: 'upcoming', label: 'Upcoming', icon: '📅' },
              { key: 'thisWeekend', label: 'This Weekend', icon: '🏁' },
              { key: 'thisWeek', label: 'This Week', icon: '📆' },
              { key: 'thisMonth', label: 'This Month', icon: '🗓️' }
            ].map((space) => (
              <button
                key={space.key}
                onClick={() => setActiveSpace(space.key as any)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: activeSpace === space.key 
                    ? '#3b82f6' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activeSpace === space.key ? '#ffffff' : '#475569',
                  fontSize: '14px',
                  fontWeight: activeSpace === space.key ? '600' : '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease',
                  boxShadow: activeSpace === space.key 
                    ? '0 2px 4px rgba(59, 130, 246, 0.2)' 
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeSpace !== space.key) {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSpace !== space.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{space.icon}</span>
                {!sidebarCollapsed && space.label}
              </button>
            ))}
          </div>

          {/* Distance Filters */}
          {!sidebarCollapsed && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#64748b', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                padding: '0 12px'
              }}>
                Distance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { key: '', label: 'All Distances', color: '#64748b' },
                  { key: '5K', label: '5K', color: '#059669' },
                  { key: '10K', label: '10K', color: '#2563eb' },
                  { key: 'Half', label: 'Half Marathon', color: '#d97706' },
                  { key: 'Marathon', label: 'Marathon', color: '#dc2626' },
                  { key: 'Ultra', label: 'Ultra', color: '#7c3aed' }
                ].map((filter) => (
                  <button
                    key={filter.key || 'all'}
                    onClick={() => setDistanceCategory(filter.key)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: distanceCategory === filter.key 
                        ? (filter.key ? filter.color : '#3b82f6')
                        : '#f8fafc',
                      border: `1px solid ${distanceCategory === filter.key ? (filter.key ? filter.color : '#3b82f6') : '#e2e8f0'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: distanceCategory === filter.key ? 'white' : '#475569',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: distanceCategory === filter.key 
                        ? `0 2px 4px ${filter.key ? filter.color : '#3b82f6'}40` 
                        : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (distanceCategory !== filter.key) {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = filter.key ? filter.color : '#3b82f6';
                        e.currentTarget.style.color = '#1e293b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (distanceCategory !== filter.key) {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surface Filters */}
          {!sidebarCollapsed && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#64748b', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                padding: '0 12px'
              }}>
                Surface
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { key: '', label: 'All Surfaces', color: '#64748b' },
                  { key: 'road', label: 'Road', color: '#059669' },
                  { key: 'trail', label: 'Trail', color: '#d97706' },
                  { key: 'track', label: 'Track', color: '#2563eb' },
                  { key: 'mixed', label: 'Mixed', color: '#7c3aed' }
                ].map((filter) => (
                  <button
                    key={filter.key || 'all'}
                    onClick={() => setSurface(filter.key)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: surface === filter.key 
                        ? (filter.key ? filter.color : '#3b82f6')
                        : '#f8fafc',
                      border: `1px solid ${surface === filter.key ? (filter.key ? filter.color : '#3b82f6') : '#e2e8f0'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: surface === filter.key ? 'white' : '#475569',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: surface === filter.key 
                        ? `0 2px 4px ${filter.key ? filter.color : '#3b82f6'}40` 
                        : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (surface !== filter.key) {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = filter.key ? filter.color : '#3b82f6';
                        e.currentTarget.style.color = '#1e293b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (surface !== filter.key) {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Filters */}
          {!sidebarCollapsed && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#64748b', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                padding: '0 12px'
              }}>
                More Filters
              </div>
              
              {/* City Filter */}
              <div style={{ marginBottom: '16px', padding: '0 12px' }}>
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  City
                </label>
                <input
                  placeholder="Filter by city"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#ffffff'
                  }}
                />
              </div>

              {/* Kid-Friendly Filter */}
              <div style={{ marginBottom: '16px', padding: '0 12px' }}>
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Kid-Friendly
                </label>
                <select
                  value={kidFriendly}
                  onChange={(e) => { setKidFriendly(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#ffffff'
                  }}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {/* Date Range */}
              <div style={{ marginBottom: '16px', padding: '0 12px' }}>
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Date Range
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="date"
                    placeholder="From"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <input
                    type="date"
                    placeholder="To"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              {/* Clear All Button */}
              <div style={{ padding: '0 12px' }}>
                <button
                  onClick={() => { 
                    setQ(''); 
                    setQInput(''); 
                    setCity(''); 
                    setDateFrom(''); 
                    setDateTo(''); 
                    setDistanceCategory(''); 
                    setSurface(''); 
                    setKidFriendly(''); 
                    setSort('date_asc'); 
                    setPage(1);
                    setActiveSpace('all');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexShrink: 0
        }}>
          {!sidebarCollapsed && (
            <div style={{ 
              fontSize: '12px', 
              color: '#64748b', 
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Run Houston</strong>
              </div>
              <div>
                Find your next race in Houston
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ 
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <input
              ref={searchRef}
              placeholder="Search races (press /)"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }}
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <option value="date_asc">Soonest</option>
            <option value="date_desc">Latest</option>
            <option value="city_asc">City A→Z</option>
            <option value="city_desc">City Z→A</option>
          </select>

          {/* Density Toggle */}
          <div style={{ 
            display: 'flex', 
            border: '1px solid #d1d5db', 
            borderRadius: '8px', 
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <button
              onClick={() => setDensity('compact')}
              style={{
                padding: '12px 16px',
                background: density === 'compact' 
                  ? '#3b82f6' 
                  : 'transparent',
                color: density === 'compact' ? '#ffffff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              style={{
                padding: '12px 16px',
                background: density === 'comfortable' 
                  ? '#3b82f6' 
                  : 'transparent',
                color: density === 'comfortable' ? '#ffffff' : '#475569',
                border: 'none',
                borderLeft: '1px solid #d1d5db',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Comfortable
            </button>
          </div>
        </div>


        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Main Race List */}
          <div style={{ 
            flex: 1,
            padding: '32px',
            paddingBottom: '60px', // Extra space to prevent footer overlap
            overflowY: 'auto',
            background: '#f8fafc'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                color: '#1e293b',
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em'
              }}>
                {activeSpace === 'all' ? 'All Races' : 
                 activeSpace === 'upcoming' ? 'Upcoming Races' :
                 activeSpace === 'thisWeek' ? 'This Week' : 'This Month'}
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: '#64748b', 
                margin: '0 0 20px 0',
                fontWeight: '500'
              }}>
                {total > 0 ? `${total} races found` : 'No races found'}
              </p>

              {/* Active Filters */}
              {(q || city || distanceCategory || surface || kidFriendly !== '') && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {q && <FilterChip label={`Search: ${q}`} onClear={() => { setQ(''); setQInput(''); }} />}
                  {city && <FilterChip label={`City: ${city}`} onClear={() => setCity('')} />}
                  {distanceCategory && <FilterChip label={`Distance: ${distanceCategory}`} onClear={() => setDistanceCategory('')} />}
                  {surface && <FilterChip label={`Surface: ${surface}`} onClear={() => setSurface('')} />}
                  {kidFriendly !== '' && <FilterChip label={`Kid-friendly: ${kidFriendly === 'true' ? 'Yes' : 'No'}`} onClear={() => setKidFriendly('')} />}
                </div>
              )}
                </div>
                
            {/* Race List */}
                  <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isWide ? 'repeat(2, 1fr)' : '1fr',
              gap: density === 'compact' ? '16px' : '20px'
            }}>
              {items.map((race) => (
                <div
                  key={race.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: density === 'compact' ? '16px' : '20px',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ 
                      fontSize: density === 'compact' ? '18px' : '20px', 
                      fontWeight: '700', 
                      color: '#1e293b',
                      margin: '0',
                      lineHeight: '1.3',
                      letterSpacing: '-0.01em'
                    }}>
                      {race.name}
                    </h3>
                  </div>
                
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#64748b', 
                    marginBottom: '12px',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    fontWeight: '500'
                  }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#dbeafe',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe'
                    }}>
                      📅 {new Date(race.date).toLocaleDateString()}
                    </span>
                    {race.start_time && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: '#e0e7ff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#3730a3',
                        border: '1px solid #c7d2fe'
                      }}>
                        🕐 {race.start_time}
                      </span>
                    )}
                  </div>
                
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#64748b', 
                    marginBottom: '12px',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    fontWeight: '500',
                    flexWrap: 'wrap'
                  }}>
                    {/* Full Address */}
                    {race.address && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: '#dcfce7',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#166534',
                        border: '1px solid #bbf7d0'
                      }}>
                        🏠 {[race.address, race.city, race.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {race.surface && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: '#fef3c7',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#92400e',
                        border: '1px solid #fde68a'
                      }}>
                        🏃 {capitalizeSurface(race.surface)}
                      </span>
                    )}
                    {race.kid_run && (
                      <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                        gap: '6px',
                        background: '#fef3c7',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#92400e',
                        border: '1px solid #fde68a'
                      }}>
                        👶 Kid-friendly
                      </span>
                    )}
                </div>

              
              {race.official_website_url && (
                <a 
                  href={race.official_website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                  style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        border: '1px solid #2563eb'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      Visit Website →
                </a>
              )}
            </div>
          ))}
        </div>

            {/* Loading indicator */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loading />
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: '20px' }} />
          </div>

          {/* Split view removed - no longer needed */}
        </div>
      </div>

      {/* Drawer removed - all info now on cards */}
    </div>
  );
};