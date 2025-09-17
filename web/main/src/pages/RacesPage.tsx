import React from 'react';

import { useRaces } from "@shared/hooks/useRaces";
import { races as racesApi } from "@shared/services/api";
import { capitalizeSurface } from "@shared/utils/formatting";
import { Loading } from "@shared/components/Loading";
import { Alert } from "@shared/components/Alert";
import { DirectionsButton } from "@shared/components/DirectionsButton";
import { RaceMap } from "../components/RaceMap";

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

// Helper function to map frontend distance values to database values
const mapDistanceToDatabase = (distance: string): string => {
  const mapping: { [key: string]: string } = {
    '5K': '5k',
    '10K': '10k', 
    'Half': 'half marathon',
    'Marathon': 'marathon',
    'Ultra': 'ultra'
  };
  return mapping[distance] || distance.toLowerCase();
};

export const RacesPage: React.FC = () => {
  const { racesLoading, error } = useRaces();
  
  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [items, setItems] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  
  // Lazy loading state
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [qInput, setQInput] = React.useState('');
  const [city, setCity] = React.useState('');
  const [distanceCategory, setDistanceCategory] = React.useState<string[]>([]);
  const [surface, setSurface] = React.useState<string[]>([]);
  const [kidFriendly, setKidFriendly] = React.useState<string>('');
  const [sort, setSort] = React.useState('date_asc');
  // Removed drawer functionality - all info now on cards
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  // Responsive breakpoints
  const [isMobile, setIsMobile] = React.useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = React.useState<'cards' | 'map'>('cards');
  
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const [initialLoad, setInitialLoad] = React.useState(true);
  
  // Mobile-first sidebar state - default to open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      // Default: open on desktop, closed on mobile
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [activeSpace, setActiveSpace] = React.useState<'all' | 'upcoming' | 'thisWeek' | 'thisMonth' | 'thisWeekend'>('all');
  // Split view removed - no longer needed without compare functionality

  // Save sidebar state to localStorage
  const handleSidebarToggle = React.useCallback((open: boolean) => {
    setSidebarOpen(open);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(open));
    }
  }, []);

  // Helper functions for multiple selections
  const toggleDistanceCategory = React.useCallback((category: string) => {
    setDistanceCategory(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
    setPage(1);
  }, []);

  const toggleSurface = React.useCallback((surfaceType: string) => {
    setSurface(prev => {
      if (prev.includes(surfaceType)) {
        return prev.filter(s => s !== surfaceType);
      } else {
        return [...prev, surfaceType];
      }
    });
    setPage(1);
  }, []);

  const fetch = React.useCallback(async () => {
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      // Handle weekend filter
      let weekendDateFrom = dateFrom;
      let weekendDateTo = dateTo;
      
      if (activeSpace === 'thisWeekend') {
        const weekendRange = getWeekendRange();
        weekendDateFrom = weekendRange.from;
        weekendDateTo = weekendRange.to;
      }
      
      let allRaces: any[] = [];
      let totalCount = 0;
      
      // If multiple distances or surfaces are selected, we need to make multiple API calls
      // and combine the results since the backend doesn't support OR logic for these filters
      if (distanceCategory.length > 1 || surface.length > 1) {
        // Make separate API calls for each distance/surface combination
        const promises: Promise<any>[] = [];
        
        if (distanceCategory.length > 0 && surface.length > 0) {
          // Both distance and surface have multiple selections - create all combinations
          for (const dist of distanceCategory) {
            for (const surf of surface) {
              promises.push(racesApi.list({
                q, city, 
                distanceCategory: mapDistanceToDatabase(dist), 
                surface: surf, 
                sort, page, pageSize, 
                dateFrom: weekendDateFrom || undefined, 
                dateTo: weekendDateTo || undefined, 
                kidFriendly: kidFriendly === '' ? undefined as any : kidFriendly === 'true'
              }));
            }
          }
        } else if (distanceCategory.length > 1) {
          // Multiple distances only
          for (const dist of distanceCategory) {
            promises.push(racesApi.list({
              q, city, 
              distanceCategory: mapDistanceToDatabase(dist), 
              surface: surface.length > 0 ? surface[0] : undefined, 
              sort, page, pageSize, 
              dateFrom: weekendDateFrom || undefined, 
              dateTo: weekendDateTo || undefined, 
              kidFriendly: kidFriendly === '' ? undefined as any : kidFriendly === 'true'
            }));
          }
        } else if (surface.length > 1) {
          // Multiple surfaces only
          for (const surf of surface) {
            promises.push(racesApi.list({
              q, city, 
              distanceCategory: distanceCategory.length > 0 ? mapDistanceToDatabase(distanceCategory[0]) : undefined, 
              surface: surf, 
              sort, page, pageSize, 
              dateFrom: weekendDateFrom || undefined, 
              dateTo: weekendDateTo || undefined, 
              kidFriendly: kidFriendly === '' ? undefined as any : kidFriendly === 'true'
            }));
          }
        }
        
        // Execute all API calls
        const results = await Promise.all(promises);
        
        // Combine and deduplicate results
        const raceMap = new Map();
        results.forEach(result => {
          const items = result.items ?? result;
          items.forEach((race: any) => {
            if (!raceMap.has(race.id)) {
              raceMap.set(race.id, race);
            }
          });
          totalCount = Math.max(totalCount, result.total ?? items.length); // Use max total as approximation
        });
        
        allRaces = Array.from(raceMap.values());
      } else {
        // Single selections or no multi-select - use original API call
        const data = await racesApi.list({ 
          q, 
          city, 
          distanceCategory: distanceCategory.length > 0 ? distanceCategory.map(mapDistanceToDatabase).join(',') : undefined, 
          surface: surface.length > 0 ? surface.join(',') : undefined, 
          sort, 
          page, 
          pageSize, 
          dateFrom: weekendDateFrom || undefined, 
          dateTo: weekendDateTo || undefined, 
          kidFriendly: kidFriendly === '' ? undefined as any : kidFriendly === 'true' 
        });
        
        allRaces = data.items ?? data;
        totalCount = data.total ?? (Array.isArray(data) ? data.length : 0);
      }
      
      const incoming = allRaces;
      
      // Check if we've reached the end of results
      if (incoming.length === 0 || incoming.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (page === 1) {
        // First page - replace all items
        setItems(incoming);
        setHasMore(incoming.length === pageSize);
      } else {
        // Subsequent pages - append new items
        setItems(prev => {
          const existing = new Map(prev.map(r => [r.id, r]));
          for (const r of incoming) existing.set(r.id, r);
          return Array.from(existing.values());
        });
      }
      setTotal(totalCount);
    } catch (e) {
      // ignore here; existing Alert path handles errors via other hook when used
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setInitialLoad(false);
    }
  }, [q, city, distanceCategory, surface, sort, page, pageSize, kidFriendly, dateFrom, dateTo, activeSpace]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetch();
  }, [q, city, distanceCategory, surface, sort, kidFriendly, dateFrom, dateTo, activeSpace]);

  // Load more when page changes (but not on initial load)
  React.useEffect(() => {
    if (page > 1) {
      fetch();
    }
  }, [page]);

  // Debounce search input to keep focus and avoid flicker
  React.useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setQ(qInput);
    }, 250);
    return () => clearTimeout(id);
  }, [qInput]);

  // Responsive breakpoint detection
  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsMobile(true);
        setSidebarOpen(false); // Close sidebar on mobile by default
      } else {
        setIsMobile(false);
      }
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
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

  // Infinite scroll with debouncing
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || isLoadingMore) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading && !isLoadingMore) {
        // Debounce to prevent rapid firing
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setPage(p => p + 1);
        }, 100);
      }
    }, { 
      rootMargin: '100px',
      threshold: 0.1 
    });
    
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timeoutId);
    };
  }, [hasMore, loading, isLoadingMore]);

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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            cursor: 'pointer'
          }}
          onClick={() => handleSidebarToggle(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <div 
        onClick={!sidebarOpen ? () => handleSidebarToggle(true) : undefined}
        style={{
          width: isMobile ? '280px' : (sidebarOpen ? '240px' : '60px'),
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: isMobile ? '0 8px 32px rgba(0, 0, 0, 0.12)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          overflow: 'hidden',
          cursor: !sidebarOpen ? 'pointer' : 'default'
        }}>
        {/* Sidebar Header */}
        <div 
          onClick={(e) => sidebarOpen && e.stopPropagation()}
          style={{
            padding: isMobile ? '16px' : (sidebarOpen ? '20px' : '12px'),
            borderBottom: sidebarOpen ? '1px solid #e2e8f0' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : (sidebarOpen ? 'space-between' : 'center'),
            minHeight: isMobile ? '56px' : 'auto'
          }}>
          {(isMobile || sidebarOpen) && (
            <div style={{ 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: '700', 
              color: '#1e293b',
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px' }}>🏃‍♂️</span>
              Run Houston
            </div>
          )}
          {/* Toggle button - always show */}
          <button
            onClick={() => handleSidebarToggle(!sidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              padding: isMobile ? '12px' : '8px',
              borderRadius: '8px',
              color: '#475569',
              fontSize: isMobile ? '18px' : '20px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? '44px' : '32px',
              height: isMobile ? '44px' : '32px',
              minWidth: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px'
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
            {isMobile ? (sidebarOpen ? '✕' : '☰') : (sidebarOpen ? '←' : '→')}
          </button>
        </div>

        {/* Filters Navigation */}
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{ padding: '12px', flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          
          {/* Collapsed State - Show All Filter Icons */}
          {!sidebarOpen && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '8px',
              padding: '16px 8px'
            }}>
              {/* Time View Icon */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: activeSpace !== 'all' ? '#3b82f6' : '#f1f5f9',
                  border: `1px solid ${activeSpace !== 'all' ? '#2563eb' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: activeSpace !== 'all' ? 'white' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  📅
                </div>
              </div>

              {/* Distance Icon */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: distanceCategory.length > 0 ? '#059669' : '#f1f5f9',
                  border: `1px solid ${distanceCategory.length > 0 ? '#047857' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: distanceCategory.length > 0 ? 'white' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  🏃
                </div>
                {distanceCategory.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}>
                    {distanceCategory.length}
                  </div>
                )}
              </div>

              {/* Surface Icon */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: surface.length > 0 ? '#d97706' : '#f1f5f9',
                  border: `1px solid ${surface.length > 0 ? '#b45309' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: surface.length > 0 ? 'white' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  🛣️
                </div>
                {surface.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}>
                    {surface.length}
                  </div>
                )}
              </div>

              {/* Other Filters Icon */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: (city || kidFriendly !== '' || q) ? '#7c3aed' : '#f1f5f9',
                  border: `1px solid ${(city || kidFriendly !== '' || q) ? '#6d28d9' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: (city || kidFriendly !== '' || q) ? 'white' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  ⚙️
                </div>
                {(city || kidFriendly !== '' || q) && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}>
                    {(city ? 1 : 0) + (kidFriendly !== '' ? 1 : 0) + (q ? 1 : 0)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expanded State - Show Full Filters */}
          {sidebarOpen && (
            <>
              {/* Time-based Views */}
              <div style={{ marginBottom: '24px' }}>
                {(isMobile || sidebarOpen) && (
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
                onClick={() => {
                  setActiveSpace(space.key as any);
                  if (isMobile) handleSidebarToggle(false); // Close sidebar on mobile after selection
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '16px' : '12px',
                  padding: isMobile ? '16px' : '12px',
                  background: activeSpace === space.key 
                    ? '#3b82f6' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '8px',
                  cursor: 'pointer',
                  color: activeSpace === space.key ? '#ffffff' : '#475569',
                  fontSize: isMobile ? '16px' : '14px',
                  fontWeight: activeSpace === space.key ? '600' : '500',
                  marginBottom: isMobile ? '8px' : '4px',
                  transition: 'all 0.2s ease',
                  boxShadow: activeSpace === space.key 
                    ? '0 2px 4px rgba(59, 130, 246, 0.2)' 
                    : 'none',
                  minHeight: isMobile ? '48px' : 'auto',
                  textAlign: 'left'
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
                <span style={{ fontSize: isMobile ? '20px' : '18px' }}>{space.icon}</span>
                {(isMobile || sidebarOpen) && <span>{space.label}</span>}
              </button>
            ))}
          </div>

          {/* Distance Filters */}
          {(isMobile || sidebarOpen) && (
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
                ].map((filter) => {
                  const isSelected = filter.key === '' ? distanceCategory.length === 0 : distanceCategory.includes(filter.key);
                  return (
                    <button
                      key={filter.key || 'all'}
                      onClick={() => filter.key === '' ? setDistanceCategory([]) : toggleDistanceCategory(filter.key)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: isSelected 
                          ? (filter.key ? filter.color : '#3b82f6')
                          : '#f8fafc',
                        border: `1px solid ${isSelected ? (filter.key ? filter.color : '#3b82f6') : '#e2e8f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: isSelected ? 'white' : '#475569',
                        fontSize: '13px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected 
                          ? `0 2px 4px ${filter.key ? filter.color : '#3b82f6'}40` 
                          : '0 1px 2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.borderColor = filter.key ? filter.color : '#3b82f6';
                          e.currentTarget.style.color = '#1e293b';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#475569';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by button click
                        style={{
                          margin: 0,
                          accentColor: isSelected ? (filter.key ? filter.color : '#3b82f6') : '#64748b'
                        }}
                      />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Surface Filters */}
          {(isMobile || sidebarOpen) && (
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
                ].map((filter) => {
                  const isSelected = filter.key === '' ? surface.length === 0 : surface.includes(filter.key);
                  return (
                    <button
                      key={filter.key || 'all'}
                      onClick={() => filter.key === '' ? setSurface([]) : toggleSurface(filter.key)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: isSelected 
                          ? (filter.key ? filter.color : '#3b82f6')
                          : '#f8fafc',
                        border: `1px solid ${isSelected ? (filter.key ? filter.color : '#3b82f6') : '#e2e8f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: isSelected ? 'white' : '#475569',
                        fontSize: '13px',
                        fontWeight: '500',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected 
                          ? `0 2px 4px ${filter.key ? filter.color : '#3b82f6'}40` 
                          : '0 1px 2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.borderColor = filter.key ? filter.color : '#3b82f6';
                          e.currentTarget.style.color = '#1e293b';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#475569';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by button click
                        style={{
                          margin: 0,
                          accentColor: isSelected ? (filter.key ? filter.color : '#3b82f6') : '#64748b'
                        }}
                      />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Filters */}
          {(isMobile || sidebarOpen) && (
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
                    setDistanceCategory([]); 
                    setSurface([]); 
                    setKidFriendly(''); 
                    setSort('date_asc'); 
                    setPage(1);
                    setActiveSpace('all');
                    if (isMobile) handleSidebarToggle(false);
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
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexShrink: 0
        }}>
          {(isMobile || sidebarOpen) && (
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
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: isMobile ? '0' : (sidebarOpen ? '0px' : '0px'),
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* Top Bar */}
        <div style={{ 
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: isMobile ? '12px' : '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '12px' : '20px',
          position: 'sticky',
          top: '0',
          zIndex: 10,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          flexDirection: 'row'
        }}>
          {/* Hamburger Menu Button - Show only on mobile when sidebar is not visible */}
          {isMobile && !sidebarOpen && (
            <button
              onClick={() => handleSidebarToggle(true)}
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
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                marginRight: '12px'
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
              ☰
            </button>
          )}
          {/* Search */}
          <div style={{ 
            flex: 1, 
            maxWidth: '400px',
            width: 'auto'
          }}>
            <input
              ref={searchRef}
              placeholder={isMobile ? "Search races..." : "Search races (press /)"}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '16px' : '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: isMobile ? '12px' : '8px',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: '500',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                minHeight: isMobile ? '48px' : 'auto'
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
              padding: isMobile ? '16px' : '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: isMobile ? '12px' : '8px',
              fontSize: isMobile ? '16px' : '15px',
              fontWeight: '500',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              minHeight: 'auto',
              width: 'auto'
            }}
          >
            <option value="date_asc">Soonest</option>
            <option value="date_desc">Latest</option>
            <option value="city_asc">City A→Z</option>
            <option value="city_desc">City Z→A</option>
          </select>

        </div>


        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Main Race List */}
          <div style={{ 
            flex: 1,
            padding: '0',
            paddingBottom: (!hasMore && !loading && !isLoadingMore && items.length > 0) ? '0' : '60px',
            overflowY: 'auto',
            background: '#f8fafc'
          }}>
            {/* Header */}
            <div style={{ 
              marginBottom: isMobile ? '8px' : '12px',
              padding: isMobile ? '12px 16px 0 16px' : '16px 20px 0 20px'
            }}>
              <h1 style={{ 
                fontSize: isMobile ? '24px' : '32px', 
                fontWeight: '800', 
                color: '#1e293b',
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em'
              }}>
                {activeSpace === 'all' ? 'All Races' : 
                 activeSpace === 'upcoming' ? 'Upcoming Races' :
                 activeSpace === 'thisWeekend' ? 'This Weekend' :
                 activeSpace === 'thisWeek' ? 'This Week' : 'This Month'}
              </h1>
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                color: '#64748b', 
                margin: '0 0 4px 0',
                fontWeight: '500'
              }}>
                {total > 0 ? `${total} races found` : 'No races found'}
              </p>

              {/* Active Filters */}
              {(q || city || distanceCategory.length > 0 || surface.length > 0 || kidFriendly !== '') && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {q && <FilterChip label={`Search: ${q}`} onClear={() => { setQ(''); setQInput(''); }} />}
                  {city && <FilterChip label={`City: ${city}`} onClear={() => setCity('')} />}
                  {distanceCategory.length > 0 && <FilterChip label={`Distance: ${distanceCategory.join(', ')}`} onClear={() => setDistanceCategory([])} />}
                  {surface.length > 0 && <FilterChip label={`Surface: ${surface.join(', ')}`} onClear={() => setSurface([])} />}
                  {kidFriendly !== '' && <FilterChip label={`Kid-friendly: ${kidFriendly === 'true' ? 'Yes' : 'No'}`} onClear={() => setKidFriendly('')} />}
                </div>
              )}
                </div>
                
            {/* View Toggle */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '16px',
              padding: isMobile ? '0 16px' : '0 20px'
            }}>
              <button 
                onClick={() => setViewMode('cards')}
                style={{ 
                  padding: '8px 16px', 
                  background: viewMode === 'cards' ? '#3b82f6' : '#f3f4f6',
                  color: viewMode === 'cards' ? 'white' : '#374151',
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 Cards
              </button>
              <button 
                onClick={() => setViewMode('map')}
                style={{ 
                  padding: '8px 16px', 
                  background: viewMode === 'map' ? '#3b82f6' : '#f3f4f6',
                  color: viewMode === 'map' ? 'white' : '#374151',
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                🗺️ Map
              </button>
            </div>

            {/* Race List */}
            {viewMode === 'cards' ? (
                  <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '16px' : '20px',
              padding: isMobile ? '0 16px' : '0 20px'
            }}>
              {items.map((race) => (
                <div
                  key={race.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: isMobile ? '16px' : '12px',
                    padding: '20px',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: isMobile ? '200px' : 'auto'
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
                      fontSize: '20px', 
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
                    {race.distance && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: '#e0f2fe',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#0c4a6e',
                        border: '1px solid #bae6fd'
                      }}>
                        📏 {race.distance}
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

              
              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
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
                {(race.address || race.city) && (
                  <DirectionsButton 
                    race={race}
                    variant="primary"
                    size="md"
                    showIcon={true}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
            ) : (
              /* Map View */
              <div style={{ 
                padding: isMobile ? '0 16px' : '0 20px',
                height: isMobile ? '400px' : '600px'
              }}>
                <RaceMap 
                  races={items} 
                  onRaceSelect={(race) => {
                    console.log('Selected race:', race);
                  }}
                />
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loading />
              </div>
            )}

            {/* Loading more races indicator */}
            {isLoadingMore && (
              <div style={{ 
                textAlign: 'center', 
                margin: '0',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    border: '2px solid #e2e8f0',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '-0.01em'
                  }}>
                    Loading more races...
                  </span>
                </div>
              </div>
            )}

            {/* End of results message - ABSOLUTE ZERO white space */}
            {!hasMore && !loading && !isLoadingMore && items.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                margin: '0',
                padding: '0',
                background: 'transparent',
                position: 'sticky',
                bottom: '0',
                zIndex: 10
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e2e8f0',
                  margin: '0',
                  fontSize: '11px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    background: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '7px',
                    fontWeight: '600'
                  }}>
                    ✓
                  </div>
                  <span style={{
                    color: '#374151',
                    fontSize: '11px',
                    fontWeight: '500',
                    letterSpacing: '-0.01em',
                    margin: '0',
                    padding: '0'
                  }}>
                    All {items.length} races loaded
                  </span>
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel - minimal height */}
            <div ref={sentinelRef} style={{ height: '1px' }} />
          </div>

          {/* Split view removed - no longer needed */}
        </div>
      </div>

      {/* Drawer removed - all info now on cards */}
    </div>
  );
};