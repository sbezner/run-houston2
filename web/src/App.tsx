import React from 'react';
import type { Race } from './types';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { parseCsvFile } from './import/parseCsv';
import { validateAndTransform } from './import/validation';
import { downloadErrorsCsv } from './import/download';
import type { RaceCsvRow, RaceUpsert, ImportError } from './import/errors';

// Helper function to capitalize first letter of surface type
const capitalizeSurface = (surface: string | null | undefined): string => {
  if (!surface) return '';
  return surface.charAt(0).toUpperCase() + surface.slice(1);
};

// Enhanced Marketing Home Component - Phase 3
const MarketingHome = () => (
  <div style={{ 
    width: '100vw', 
    minHeight: '100vh',
    padding: '0px 20px 20px 20px',
    boxSizing: 'border-box',
    margin: 0,
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw'
  }}>
    {/* Download Apps Section */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '0px 40px 10px 40px', 
      borderRadius: '25px',
      textAlign: 'center',
      marginBottom: '60px'
    }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '20px', 
        color: '#333',
        fontWeight: '700'
      }}>📱 Get the Run Houston App</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '40px',
        lineHeight: '1.5'
      }}>
        Download our mobile app for the best race discovery experience in the Greater Houston area
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '25px', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <button style={{ 
          backgroundColor: '#000', 
          color: 'white', 
          padding: '18px 30px', 
          border: 'none', 
          borderRadius: '15px', 
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          📱 iPhone Version
        </button>
        <button style={{ 
          backgroundColor: '#3DDC84', 
          color: 'white', 
          padding: '18px 30px', 
          border: 'none', 
          borderRadius: '15px', 
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '600',
          boxShadow: '0 6px 20px rgba(61,220,132,0.3)',
          transition: 'all 0.3s ease'
        }}>
          🤖 Android Version
        </button>
      </div>
    </div>

    {/* Enhanced Features Section */}
    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '15px', 
        color: '#333',
        fontWeight: '700'
      }}>Why Choose Run Houston?</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '50px',
        lineHeight: '1.5'
      }}>
        We're your ultimate companion for discovering and planning your next running adventure in the Houston area.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'space-around',
        width: '100%'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Smart Race Discovery</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Find races that match your goals, schedule, and location preferences with our intelligent filtering system.
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Interactive Maps</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Visualize race locations, plan your route, and discover new running spots with our detailed mapping system.
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px 30px', 
          borderRadius: '20px', 
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          flex: '1',
          minWidth: '280px',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#007AFF', fontWeight: '600' }}>Mobile-First Design</h3>
          <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
            Optimized for runners on the go with a seamless mobile experience that works perfectly on any device.
          </p>
        </div>
      </div>
    </div>

    {/* New: Community Section */}
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '60px 40px', 
      borderRadius: '25px',
      textAlign: 'center',
      marginBottom: '60px'
    }}>
      <h2 style={{ 
        fontSize: '42px', 
        marginBottom: '20px', 
        color: '#333',
        fontWeight: '700'
      }}>Join the Houston Running Community</h2>
      <p style={{ 
        fontSize: '20px', 
        color: '#666', 
        marginBottom: '40px',
        maxWidth: '800px',
        margin: '0 auto 40px auto',
        lineHeight: '1.5'
      }}>
        Connect with fellow runners, share your achievements, and stay motivated with our growing community of Houston-area runners.
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏃‍♀️</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>500+</div>
          <div style={{ color: '#666' }}>Active Runners</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏁</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>150+</div>
          <div style={{ color: '#666' }}>Races Listed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>⭐</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>4.8/5</div>
          <div style={{ color: '#666' }}>User Rating</div>
        </div>
      </div>
    </div>
  </div>
);

// Professional Admin Dashboard Component - Now with Authentication
const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [races, setRaces] = React.useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = React.useState(false);
  const [editingRace, setEditingRace] = React.useState<Race | null>(null);
  const [deletingRace, setDeletingRace] = React.useState<Race | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: '',
    date: '',
    start_time: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    surface: '',
    kid_run: false,
    official_website_url: '',
    latitude: '',
    longitude: ''
  });

  const [createForm, setCreateForm] = React.useState({
    name: '',
    date: '',
    start_time: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    surface: 'road',
    kid_run: false,
    official_website_url: '',
    latitude: '',
    longitude: ''
  });

  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  // const [bulkOperation, setBulkOperation] = React.useState<'none' | 'delete' | 'update'>('none');
  const [selectedRaces, setSelectedRaces] = React.useState<Set<number>>(new Set());

  // CSV Import State
  const [importState, setImportState] = React.useState<'idle' | 'parsed' | 'validated' | 'committing' | 'done' | 'error'>('idle');
  const [rawRows, setRawRows] = React.useState<RaceCsvRow[]>([]);
  const [previewRows, setPreviewRows] = React.useState<RaceUpsert[]>([]);
  const [importErrors, setImportErrors] = React.useState<ImportError[]>([]);
  const [importWarnings, setImportWarnings] = React.useState<ImportError[]>([]);
  const [commitProgress, setCommitProgress] = React.useState({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
  const [aborter, setAborter] = React.useState<AbortController | null>(null);

  // Define fetchAdminRaces before it's used in useEffect
  const fetchAdminRaces = async () => {
    setRacesLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/admin/races', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }

      const data = await response.json();
      setRaces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRacesLoading(false);
    }
  };

  // Check if user is already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchAdminRaces();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.access_token);
      setIsLoggedIn(true);
      fetchAdminRaces();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setRaces([]);
  };

  const handleEditRace = (race: Race) => {
    setEditingRace(race);
    setEditForm({
      name: race.name,
      date: race.date,
      start_time: race.start_time || '',
      address: race.address || '',
      city: race.city || '',
      state: race.state || '',
      zip: race.zip || '',
      surface: race.surface || '',
      kid_run: race.kid_run || false,
      official_website_url: race.official_website_url || '',
      latitude: race.latitude ? race.latitude.toString() : '',
      longitude: race.longitude ? race.longitude.toString() : ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Ensure editingRace exists
      if (!editingRace) {
        setError('No race selected for editing');
        return;
      }
      
      // Create clean data object with only fields that have actually changed
      const cleanData: any = {};
      
      // Only include fields that have changed from the original race
      if (editForm.name !== editingRace.name) {
        cleanData.name = editForm.name;
      }
      if (editForm.date !== editingRace.date) {
        cleanData.date = editForm.date;
      }
      if (editForm.start_time !== (editingRace.start_time || '')) {
        cleanData.start_time = editForm.start_time || null;
      }
      if (editForm.address !== (editingRace.address || '')) {
        cleanData.address = editForm.address || null;
      }
      if (editForm.city !== (editingRace.city || '')) {
        cleanData.city = editForm.city || null;
      }
      if (editForm.state !== (editingRace.state || '')) {
        cleanData.state = editForm.state || null;
      }
      if (editForm.zip !== (editingRace.zip || '')) {
        cleanData.zip = editForm.zip || null;
      }
      if (editForm.surface !== (editingRace.surface || '')) {
        cleanData.surface = editForm.surface || null;
      }
      if (editForm.kid_run !== editingRace.kid_run) {
        cleanData.kid_run = editForm.kid_run;
      }
      if (editForm.official_website_url !== (editingRace.official_website_url || '')) {
        cleanData.official_website_url = editForm.official_website_url || null;
      }
      if (editForm.latitude !== (editingRace.latitude ? editingRace.latitude.toString() : '')) {
        cleanData.latitude = editForm.latitude ? parseFloat(editForm.latitude) : null;
      }
      if (editForm.longitude !== (editingRace.longitude ? editingRace.longitude.toString() : '')) {
        cleanData.longitude = editForm.longitude ? parseFloat(editForm.longitude) : null;
      }

      // Check if there are any fields to update
      if (Object.keys(cleanData).length === 0) {
        console.log('No fields changed, skipping update');
        setEditingRace(null);
        return;
      }

      // Log the data being sent for debugging
      console.log('Sending data to backend:', cleanData);
      console.log('Data type check:', typeof cleanData.start_time, typeof cleanData.city, typeof cleanData.surface);

      const response = await fetch(`http://localhost:8000/races/${editingRace.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        console.error('Full error details:', JSON.stringify(errorData, null, 2));
        
        // Handle validation errors properly
        let errorMessage = 'Failed to update race';
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh races and close edit form
      await fetchAdminRaces();
      setEditingRace(null);
      setEditForm({
        name: '',
        date: '',
        start_time: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        surface: 'road',
        kid_run: false,
        official_website_url: '',
        latitude: '',
        longitude: ''
      });
    } catch (err: any) {
      console.error('Edit race error:', err);
      setError(err.message);
    }
  };

  const exportToCSV = () => {
    console.log('Export CSV clicked, races count:', races.length);
    console.log('Races data:', races);
    
    if (races.length === 0) {
      setError('No races to export');
      return;
    }

    try {
      // Create CSV content
      const headers = [
        'id', 'name', 'date', 'start_time', 'address', 'city', 'state', 'zip',
        'surface', 'kid_run', 'official_website_url', 'latitude', 'longitude'
      ];
      
      const csvContent = [
        headers.join(','),
        ...races.map(race => [
          race.id,
          `"${race.name.replace(/"/g, '""')}"`,
          race.date,
          race.start_time || '',
          `"${(race.address || '').replace(/"/g, '""')}"`,
          `"${(race.city || '').replace(/"/g, '""')}"`,
          `"${(race.state || '').replace(/"/g, '""')}"`,
          `"${(race.zip || '').replace(/"/g, '""')}"`,
          race.surface || '',
          race.kid_run ? 'true' : 'false',
          `"${(race.official_website_url || '').replace(/"/g, '""')}"`,
          race.latitude || '',
          race.longitude || ''
        ].join(','))
      ].join('\n');

      console.log('CSV content created:', csvContent);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `races_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('CSV export completed successfully');
      setError('CSV exported successfully!'); // Show success message
      // Clear success message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('CSV export error:', error);
      setError(`CSV export failed: ${error}`);
    }
  };

  // CSV Import Functions
  const handleCSVParse = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setError('');
      const result = await parseCsvFile(csvFile);
      
      if (result.headerErrors.length > 0) {
        setError(`CSV header errors: ${result.headerErrors.join(', ')}`);
        return;
      }

      if (result.rows.length === 0) {
        setError('No data rows found in CSV file');
        return;
      }

      // Store raw rows and validate
      setRawRows(result.rows);
      const validation = validateAndTransform(result.rows);
      
      setPreviewRows(validation.valid);
      setImportErrors(validation.errors);
      setImportWarnings(validation.warnings);
      
      // Move to validation step
      setImportState('parsed');
      
    } catch (err: any) {
      setError(`CSV parsing failed: ${err.message}`);
    }
  };

  const handleCSVCommit = async () => {
    if (previewRows.length === 0) {
      setError('No valid races to import');
      return;
    }

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAborter(controller);
    setImportState('committing');
    
    // Initialize progress
    setCommitProgress({
      total: previewRows.length,
      done: 0,
      succeeded: 0,
      failed: 0,
      created: 0,
      updated: 0
    });

    const token = localStorage.getItem('adminToken');
    const batchSize = 100;
    const concurrency = 3;
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < previewRows.length; i += batchSize) {
      batches.push(previewRows.slice(i, i + batchSize));
    }

    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (controller.signal.aborted) break;
        
        const batch = batches[batchIndex];
        const batchPromises = [];
        
        // Process batch with concurrency limit
        for (let i = 0; i < batch.length; i += concurrency) {
          if (controller.signal.aborted) break;
          
          const concurrentRaces = batch.slice(i, i + concurrency);
          const concurrentPromises = concurrentRaces.map(async (race) => {
            // const raceIndex = batchIndex * batchSize + i + index; // Unused variable
            
            try {
              const response = await fetch('http://localhost:8000/races', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(race),
                signal: controller.signal
              });

              if (response.ok) {
                totalSucceeded++;
                
                // Get operation type from response body (more reliable than headers)
                const responseData = await response.json();
                const operationType = responseData.operation_type;
                console.log(`Race ${race.id || 'new'}: Operation type from body: "${operationType}"`);
                
                if (operationType && operationType.trim().toLowerCase() === 'updated') {
                  totalUpdated++;
                  console.log(`Race ${race.id || 'new'}: Counted as UPDATE`);
                } else {
                  totalCreated++;
                  console.log(`Race ${race.id || 'new'}: Counted as CREATE`);
                }
                
                return { success: true, race, operationType };
              } else {
                totalFailed++;
                const errorData = await response.json();
                return { 
                  success: false, 
                  race, 
                  error: errorData.detail || 'Unknown error' 
                };
              }
            } catch (err: any) {
              if (err.name === 'AbortError') {
                throw err;
              }
              totalFailed++;
              return { 
                success: false, 
                race, 
                error: err.message 
              };
            } finally {
              setCommitProgress(prev => ({
                ...prev,
                done: prev.done + 1,
                succeeded: totalSucceeded,
                failed: totalFailed,
                created: totalCreated,
                updated: totalUpdated
              }));
            }
          });
          
          batchPromises.push(...concurrentPromises);
        }
        
        // Wait for current batch to complete
        await Promise.all(batchPromises);
        
        if (controller.signal.aborted) break;
      }
      
      // Import completed
      setImportState('done');
      await fetchAdminRaces();
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Import was cancelled');
      } else {
        setError(`Import failed: ${err.message}`);
      }
      setImportState('error');
    } finally {
      setAborter(null);
    }
  };

  const cancelImport = () => {
    if (aborter) {
      aborter.abort();
      setAborter(null);
    }
    setImportState('error');
    setError('Import was cancelled');
  };

  const resetImport = () => {
    setImportState('idle');
    setCsvFile(null);
    setRawRows([]);
    setPreviewRows([]);
    setImportErrors([]);
    setImportWarnings([]);
    setCommitProgress({ total: 0, done: 0, succeeded: 0, failed: 0, created: 0, updated: 0 });
    setAborter(null);
    setError('');
  };

  const handleCreateRace = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Validate required fields
      if (!createForm.name || !createForm.date || !createForm.surface) {
        setError('Race name, date, and surface type are required');
        return;
      }

      // Clear any previous errors
      setError('');

      console.log('Creating race with data:', createForm);

      const response = await fetch('http://localhost:8000/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          date: createForm.date,
          start_time: createForm.start_time || null,
          address: createForm.address || null,
          city: createForm.city || null,
          state: createForm.state || null,
          zip: createForm.zip || null,
          surface: createForm.surface || null,
          kid_run: createForm.kid_run,
          official_website_url: createForm.official_website_url || null,
          latitude: createForm.latitude ? parseFloat(createForm.latitude) : null,
          longitude: createForm.longitude ? parseFloat(createForm.longitude) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to create race';
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        throw new Error(errorMessage);
      }

      // Refresh races and close create form
      await fetchAdminRaces();
      setShowCreateForm(false);
      setCreateForm({
        name: '',
        date: '',
        start_time: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        surface: '',
        kid_run: false,
        official_website_url: '',
        latitude: '',
        longitude: ''
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRace = async () => {
    try {
      if (!deletingRace) {
        setError('No race selected for deletion');
        return;
      }
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/races/${deletingRace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete race');
      }

      // Refresh races and close delete confirmation
      await fetchAdminRaces();
      setDeletingRace(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRaces.size === 0) {
      setError('No races selected for deletion');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRaces.size} races?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;
      let errorCount = 0;

      for (const raceId of selectedRaces) {
        try {
          const response = await fetch(`http://localhost:8000/races/${raceId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      setError(`Bulk delete complete: ${successCount} races deleted, ${errorCount} failed`);
      setSelectedRaces(new Set());
      // setBulkOperation('none');
      
      // Refresh races list
      await fetchAdminRaces();
    } catch (err: any) {
      setError(`Bulk delete failed: ${err.message}`);
    }
  };

  const toggleRaceSelection = (raceId: number) => {
    const newSelected = new Set(selectedRaces);
    if (newSelected.has(raceId)) {
      newSelected.delete(raceId);
    } else {
      newSelected.add(raceId);
    }
    setSelectedRaces(newSelected);
  };

  const selectAllRaces = () => {
    setSelectedRaces(new Set(races.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedRaces(new Set());
  };

  // Login Form
  if (!isLoggedIn) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🔧 Admin Dashboard</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Sign in to manage races</p>
        </div>
        
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#333',
                fontWeight: '500'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#333',
                fontWeight: '500'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            
            {error && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                color: '#856404',
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#ccc' : '#007AFF',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard (After Login)
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '40px'
      }}>
      <div>
          <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🔧 Admin Dashboard</h1>
          <p style={{ fontSize: '18px', color: '#666' }}>Welcome back, {username}! Manage your races here.</p>
      </div>
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: error.includes('successfully') ? '#d4edda' : '#fff3cd', 
          border: `1px solid ${error.includes('successfully') ? '#c3e6cb' : '#ffeaa7'}`, 
          color: error.includes('successfully') ? '#155724' : '#856404',
          padding: '12px', 
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error.includes('successfully') ? '✅' : '⚠️'} {error}
        </div>
      )}
      
      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏃‍♂️</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>{races.length}</div>
          <div style={{ color: '#666' }}>Total Races</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
            {races.filter(race => new Date(race.date) >= new Date()).length}
          </div>
          <div style={{ color: '#666' }}>Upcoming Races</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👶</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
            {races.filter(race => race.kid_run).length}
          </div>
          <div style={{ color: '#666' }}>Kid-Friendly Races</div>
        </div>
      </div>

      {/* Races List */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '20px', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '28px', color: '#333', margin: 0 }}>Race Management</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={exportToCSV}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              📥 Export CSV
            </button>
            <button 
              onClick={() => setShowCreateForm(true)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ➕ Add New Race
            </button>
          </div>
        </div>

        {/* CSV Import Section */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '15px' }}>📤 Import Races from CSV</h3>
          
          {/* Step 1: Select + Parse */}
          {importState === 'idle' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button 
                  onClick={handleCSVParse}
                  disabled={!csvFile}
                  style={{
                    backgroundColor: csvFile ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: csvFile ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📋 Parse CSV
                </button>
                {csvFile && (
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    Selected: {csvFile.name}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                CSV should have columns: name, date, start_time, address, city, state, zip, surface, kid_run, official_website_url, latitude, longitude
              </p>
            </div>
          )}

          {/* Step 2: Validate + Preview */}
          {importState === 'parsed' && (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '16px', color: '#333', margin: 0 }}>Validation Results</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={downloadErrorsCsv.bind(null, importErrors)}
                      disabled={importErrors.length === 0}
                      style={{
                        backgroundColor: importErrors.length > 0 ? '#dc3545' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: importErrors.length > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '12px'
                      }}
                    >
                      📥 Download Errors
                    </button>
                    <button 
                      onClick={resetImport}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🔄 Re-Select File
                    </button>
                  </div>
                </div>
                
                {/* Stats */}
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                  <span>Total: {rawRows.length}</span>
                  <span style={{ color: '#28a745' }}>Valid: {previewRows.length}</span>
                  <span style={{ color: '#dc3545' }}>Invalid: {importErrors.length}</span>
                  <span style={{ color: '#ffc107' }}>Duplicates: {importWarnings.length}</span>
                </div>
              </div>

              {/* Preview Grid */}
              {previewRows.length > 0 && (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>City</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>State</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Surface</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 10).map((race, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{race.name}</td>
                          <td style={{ padding: '8px' }}>{race.date}</td>
                          <td style={{ padding: '8px' }}>{race.start_time}</td>
                          <td style={{ padding: '8px' }}>{race.city}</td>
                          <td style={{ padding: '8px' }}>{race.state}</td>
                          <td style={{ padding: '8px' }}>{race.surface}</td>
                        </tr>
                      ))}
                      {previewRows.length > 10 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '8px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                            ... and {previewRows.length - 10} more races
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Error Display */}
              {importErrors.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h5 style={{ fontSize: '14px', color: '#dc3545', marginBottom: '10px' }}>Validation Errors:</h5>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px' }}>
                    {importErrors.slice(0, 5).map((error, index) => (
                      <div key={index} style={{ 
                        padding: '6px 8px', 
                        backgroundColor: '#f8d7da', 
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        marginBottom: '4px'
                      }}>
                        <strong>Row {error.rowIndex}:</strong> {error.message}
                        {error.hint && <span style={{ color: '#721c24' }}> - {error.hint}</span>}
                      </div>
                    ))}
                    {importErrors.length > 5 && (
                      <div style={{ padding: '6px 8px', color: '#666', fontStyle: 'italic' }}>
                        ... and {importErrors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleCSVCommit}
                  disabled={importErrors.length > 0}
                  style={{
                    backgroundColor: importErrors.length === 0 ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: importErrors.length === 0 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🚀 Proceed to Import
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Commit */}
          {importState === 'committing' && (
            <div>
              <h4 style={{ fontSize: '16px', color: '#333', marginBottom: '15px' }}>Importing Races...</h4>
              
              {/* Progress Bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '20px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(commitProgress.done / commitProgress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '12px', 
                  color: '#666',
                  marginTop: '5px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <span>Progress: {commitProgress.done}/{commitProgress.total}</span>
                  <span>Success: {commitProgress.succeeded}</span>
                  {commitProgress.created > 0 && <span>Created: {commitProgress.created}</span>}
                  {commitProgress.updated > 0 && <span>Updated: {commitProgress.updated}</span>}
                  <span>Failed: {commitProgress.failed}</span>
                </div>
              </div>

              {/* Cancel Button */}
              <button 
                onClick={cancelImport}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ❌ Cancel Import
              </button>
            </div>
          )}

          {/* Success State */}
          {importState === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '15px',
                color: '#28a745'
              }}>✅</div>
              <h4 style={{ fontSize: '18px', color: '#28a745', marginBottom: '10px' }}>
                Import Complete!
              </h4>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {commitProgress.created > 0 && commitProgress.updated > 0 ? (
                  <>
                    Successfully processed {commitProgress.succeeded} races:
                    <br />
                    • {commitProgress.created} new races created
                    <br />
                    • {commitProgress.updated} existing races updated
                  </>
                ) : commitProgress.updated > 0 ? (
                  `Successfully updated ${commitProgress.updated} existing races`
                ) : (
                  `Successfully created ${commitProgress.created} new races`
                )}
                {commitProgress.failed > 0 && (
                  <>
                    <br />
                    ⚠️ {commitProgress.failed} races failed to process
                  </>
                )}
              </p>
              <button 
                onClick={resetImport}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 Import Another File
              </button>
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        {races.length > 0 && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', color: '#856404', margin: 0 }}>⚡ Bulk Operations</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={selectAllRaces}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Select All
                </button>
                <button 
                  onClick={clearSelection}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#856404' }}>
                {selectedRaces.size} race{selectedRaces.size !== 1 ? 's' : ''} selected
              </span>
              {selectedRaces.size > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Delete Selected
                </button>
              )}
            </div>
          </div>
        )}
        
        {racesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ color: '#666' }}>Loading races...</p>
          </div>
        ) : races.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏃‍♂️</div>
            <p>No races found. Add your first race to get started!</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {races.map((race) => (
              <div key={race.id} style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '12px', 
                padding: '20px',
                backgroundColor: '#f8f9fa',
                position: 'relative'
              }}>
                {/* Bulk Selection Checkbox */}
                <div style={{ 
                  position: 'absolute', 
                  top: '15px', 
                  left: '15px',
                  zIndex: 1
                }}>
                  <input
                    type="checkbox"
                    checked={selectedRaces.has(race.id)}
                    onChange={() => toggleRaceSelection(race.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '15px',
                  marginLeft: '30px' // Add left margin to accommodate checkbox
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    color: '#333',
                    fontWeight: '600',
                    margin: 0
                  }}>{race.name}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEditRace(race)}
                      style={{
                        backgroundColor: '#007AFF',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => setDeletingRace(race)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                  <div>📅 {new Date(race.date).toLocaleDateString()}</div>
                  {race.address && <div>🏠 {race.address}</div>}
                  {race.city && <div>📍 {race.city}</div>}
                  {race.zip && <div>📮 {race.zip}</div>}
                  {race.surface && <div>🏃 {capitalizeSurface(race.surface)} Surface</div>}
                  <div style={{ color: '#666' }}>👶 Kid Run: {race.kid_run ? "Yes" : "No"}</div>
                  {race.latitude && race.longitude && (
                    <div style={{ color: '#28a745', fontSize: '12px' }}>
                      🌍 {race.latitude.toFixed(4)}, {race.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Race Modal */}
      {editingRace && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>Edit Race: {editingRace.name}</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Race Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Start Time (optional)</label>
              <input
                type="time"
                value={editForm.start_time}
                onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Address (optional)</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                placeholder="e.g., 123 Main Street"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>State</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Zip Code (optional)</label>
              <input
                type="text"
                value={editForm.zip}
                onChange={(e) => setEditForm({...editForm, zip: e.target.value})}
                placeholder="e.g., 77002"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Surface Type</label>
                                <select
                    value={editForm.surface}
                    onChange={(e) => setEditForm({...editForm, surface: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="road">Road</option>
                    <option value="trail">Trail</option>
                  </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={editForm.kid_run}
                  onChange={(e) => setEditForm({...editForm, kid_run: e.target.checked})}
                />
                Kid-friendly race
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Website URL (optional)</label>
              <input
                type="url"
                value={editForm.official_website_url}
                onChange={(e) => setEditForm({...editForm, official_website_url: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Coordinates</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <button 
                  type="button" 
                  onClick={async () => {
                    let searchQuery = '';
                    if (editForm.address && editForm.city && editForm.state && editForm.zip) {
                      searchQuery = `${editForm.address}, ${editForm.city}, ${editForm.state} ${editForm.zip}`;
                    } else if (editForm.address && editForm.city && editForm.state) {
                      searchQuery = `${editForm.address}, ${editForm.city}, ${editForm.state}`;
                    } else if (editForm.city && editForm.state && editForm.zip) {
                      searchQuery = `${editForm.city}, ${editForm.state} ${editForm.zip}`;
                    } else if (editForm.city && editForm.state) {
                      searchQuery = `${editForm.city}, ${editForm.state}`;
                    }
                    
                    if (searchQuery) {
                      try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                        const data = await response.json();
                        if (data && data[0]) {
                          setEditForm({
                            ...editForm,
                            latitude: data[0].lat,
                            longitude: data[0].lon
                          });
                        }
                      } catch (error) {
                        console.error('Geocoding error:', error);
                      }
                    }
                  }}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🌍 Auto-fill from Address/City/State/Zip
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                    placeholder="e.g., 29.7633"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                    placeholder="e.g., -95.3819"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingRace(null)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Race Entry Grid */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '15px',
            width: '95%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '24px', color: '#333', margin: 0 }}>🚀 Fast Race Entry</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Entry Row */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '10px',
              marginBottom: '20px',
              border: '2px solid #e9ecef'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#495057' }}>⚡ Quick Entry (Most Common Fields)</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px 120px',
                gap: '10px',
                alignItems: 'end'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Race Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="e.g., Houston Marathon"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Date *</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({...createForm, date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
                    placeholder="Houston"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>State</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({...createForm, state: e.target.value})}
                    placeholder="TX"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Surface</label>
                  <select
                    value={createForm.surface}
                    onChange={(e) => setCreateForm({...createForm, surface: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="road">Road</option>
                    <option value="trail">Trail</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Kid Run</label>
                  <input
                    type="checkbox"
                    checked={createForm.kid_run}
                    onChange={(e) => setCreateForm({...createForm, kid_run: e.target.checked})}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>
                <div>
                  <button
                    onClick={handleCreateRace}
                    disabled={!createForm.name || !createForm.date || !createForm.surface}
                    style={{
                      backgroundColor: createForm.name && createForm.date && createForm.surface ? '#28a745' : '#ccc',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: createForm.name && createForm.date && createForm.surface ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      fontWeight: '600',
                      width: '100%',
                      transition: 'all 0.2s ease'
                    }}
                    title={!createForm.name || !createForm.date || !createForm.surface ? 'Please enter race name, date, and surface type' : 'Click to add race'}
                  >
                    {createForm.name && createForm.date && createForm.surface ? '➕ Add' : '⏳ Fill Required'}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Fields */}
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '15px', 
              borderRadius: '10px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#495057' }}>🔧 Advanced Fields (Optional)</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '15px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Start Time</label>
                  <input
                    type="time"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm({...createForm, start_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Address</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                    placeholder="123 Main Street"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Zip Code</label>
                  <input
                    type="text"
                    value={createForm.zip}
                    onChange={(e) => setCreateForm({...createForm, zip: e.target.value})}
                    placeholder="77002"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666', fontWeight: '500' }}>Website</label>
                  <input
                    type="url"
                    value={createForm.official_website_url}
                    onChange={(e) => setCreateForm({...createForm, official_website_url: e.target.value})}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Coordinates Section */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center', 
                  marginBottom: '10px' 
                }}>
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Coordinates:</span>
                  <button 
                    type="button" 
                    onClick={async () => {
                      let searchQuery = '';
                      if (createForm.address && createForm.city && createForm.state && createForm.zip) {
                        searchQuery = `${createForm.address}, ${createForm.city}, ${createForm.state} ${createForm.zip}`;
                      } else if (createForm.address && createForm.city && createForm.state) {
                        searchQuery = `${createForm.address}, ${createForm.city}, ${createForm.state}`;
                      } else if (createForm.city && createForm.state && createForm.zip) {
                        searchQuery = `${createForm.city}, ${createForm.state} ${createForm.zip}`;
                      } else if (createForm.city && createForm.state) {
                        searchQuery = `${createForm.city}, ${createForm.state}`;
                      }
                      
                      if (searchQuery) {
                        try {
                          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                          const data = await response.json();
                          if (data && data[0]) {
                            setCreateForm({
                              ...createForm,
                              latitude: data[0].lat,
                              longitude: data[0].lon
                            });
                          }
                        } catch (error) {
                          console.error('Geocoding error:', error);
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#007AFF',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🌍 Auto-fill
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={createForm.latitude}
                      onChange={(e) => setCreateForm({...createForm, latitude: e.target.value})}
                      placeholder="29.7633"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={createForm.longitude}
                      onChange={(e) => setCreateForm({...createForm, longitude: e.target.value})}
                      placeholder="-95.3819"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'center',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef'
            }}>
              <button
                onClick={() => {
                  setCreateForm({
                    name: '',
                    date: '',
                    start_time: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    surface: '',
                    kid_run: false,
                    official_website_url: '',
                    latitude: '',
                    longitude: ''
                  });
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Clear Form
              </button>
              <button
                onClick={() => {
                  // Copy city/state from previous race if available
                  if (races.length > 0) {
                    const lastRace = races[races.length - 1];
                    setCreateForm({
                      ...createForm,
                      city: lastRace.city || '',
                      state: lastRace.state || '',
                      surface: lastRace.surface || ''
                    });
                  }
                }}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📋 Copy Last Race Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRace && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>Delete Race</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Are you sure you want to delete <strong>"{deletingRace.name}"</strong>? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingRace(null)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRace}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Delete Race
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Professional Races Page Component - Now Shows Real Data
const RacesPage = () => {
  const [races, setRaces] = React.useState<Race[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/races');
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      const data = await response.json();
      setRaces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Fetching race information...</p>
        </div>
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
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          color: '#856404',
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 15px 0' }}>⚠️ {error}</p>
          <button 
            onClick={fetchRaces}
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
      width: '100%', 
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>🏃‍♂️ Upcoming Races</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          {races.length > 0 ? `Found ${races.length} races in the Greater Houston area` : 'No races found'}
        </p>
      </div>
      
      {races.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '15px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#007AFF' }}>No Races Available</h2>
          <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
            Check back soon for upcoming races in the Houston area!
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          width: '100%'
        }}>
          {races.map((race) => (
            <div key={race.id} style={{ 
              backgroundColor: 'white', 
              padding: '25px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                fontSize: '22px', 
                marginBottom: '15px', 
                color: '#333',
                fontWeight: '600'
              }}>{race.name}</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px',
                  color: '#666'
                }}>
                  <span>📅</span>
                  <span>{new Date(race.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                {race.start_time && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>⏰</span>
                    <span>{race.start_time}</span>
                  </div>
                )}
                
                {(race.city || race.state) && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>📍</span>
                    <span>{[race.city, race.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {race.surface && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666'
                  }}>
                    <span>🏃</span>
                    <span>{capitalizeSurface(race.surface)} Surface</span>
                  </div>
                )}
                
                {race.kid_run && (
                  <div style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    color: '#666',
                    fontWeight: '400'
                  }}>
                    <span>👶</span>
                    <span>Kid Run: Yes</span>
                  </div>
                )}
              </div>
              
              {race.official_website_url && (
                <a 
                  href={race.official_website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Visit Website
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Professional About Page Component - FORCED FULL WIDTH
const AboutPage = () => (
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
      <h1 style={{ fontSize: '36px', marginBottom: '10px', color: '#333' }}>About Run Houston</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>Your guide to running in the Greater Houston area</p>
    </div>
    
    <div style={{ 
      backgroundColor: 'white', 
      padding: '40px', 
      borderRadius: '15px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center',
      width: '100%'
    }}>
      <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#007AFF' }}>Our Mission</h2>
      <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
        Run Houston connects runners with the best races and events in the Greater Houston area. 
        Whether you're a beginner or an experienced runner, we help you discover your next challenge.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'space-around',
        marginTop: '40px'
      }}>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Discovery</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Find new races and events in your area
          </p>
        </div>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🗺️</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Navigation</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Easy-to-use maps and directions
          </p>
        </div>
        <div style={{ textAlign: 'center', flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📱</div>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>Mobile</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Optimized for runners on the go
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        margin: 0,
        padding: 0
      }}>
        {/* Navigation */}
        <nav style={{ 
          backgroundColor: '#fff', 
          padding: '1rem 2rem', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#007AFF' }}>
            🏃‍♂️ Run Houston
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
            <Link to="/races" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Races</Link>
            <Link to="/admin" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Admin</Link>
            <Link to="/about" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>About</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<MarketingHome />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/races" element={<RacesPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{ 
          backgroundColor: '#333', 
          color: 'white', 
          textAlign: 'center', 
          padding: '2rem',
          marginTop: 'auto',
          width: '100%'
        }}>
          <p>© 2025 Run Houston. Discover your next race adventure!</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;


