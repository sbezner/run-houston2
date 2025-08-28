import React, { useState, useEffect } from 'react';
import type { RaceReport } from '../../types';
import { races } from '../../services/api';

interface RaceReportFormProps {
  report?: RaceReport;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export const RaceReportForm: React.FC<RaceReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  mode
}) => {
  const [formData, setFormData] = useState({
    race_id: '',
    race_name: '',
    race_date: '',
    title: '',
    author_name: '',
    content_md: '',
    photos: ''
  });
  const [racesList, setRacesList] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Fetch races for the dropdown
    const fetchRaces = async () => {
      try {
        const racesData = await races.list();
        setRacesList(racesData);
      } catch (error) {
        console.error('Failed to fetch races:', error);
      }
    };
    fetchRaces();
  }, []);

  // Auto-populate race name when race_id changes (but not on initial load)
  useEffect(() => {
    // Skip auto-population on initial load
    if (isInitialLoad) {
      return;
    }

    const autoPopulateRaceName = async () => {
      if (formData.race_id && formData.race_id.trim() !== '') {
        try {
          const raceId = parseInt(formData.race_id);
          if (!isNaN(raceId)) {
            const race = racesList.find(r => r.id === raceId);
            if (race) {
              // Valid race ID found - populate the race name
              setFormData(prev => ({ ...prev, race_name: race.name }));
            } else {
              // Invalid race ID - clear the race name only if we had one from a valid race
              // Don't clear custom race names for orphaned reports
              setFormData(prev => ({ ...prev, race_name: '' }));
            }
          } else {
            // Invalid number format - clear the race name only if we had one from a valid race
            setFormData(prev => ({ ...prev, race_name: '' }));
          }
        } catch (error) {
          console.error('Failed to auto-populate race name:', error);
          // Error occurred - clear the race name only if we had one from a valid race
          setFormData(prev => ({ ...prev, race_name: '' }));
        }
      }
      // Note: We don't clear race_name when race_id is empty - preserve existing custom names
    };

    if (racesList.length > 0) {
      autoPopulateRaceName();
    }
  }, [formData.race_id, racesList, isInitialLoad]);

  useEffect(() => {
    if (report && mode === 'edit') {
      console.log('Loading report data for edit:', {
        race_id: report.race_id,
        race_name: report.race_name,
        title: report.title
      });
      const initialFormData = {
        race_id: report.race_id ? report.race_id.toString() : '',
        race_name: report.race_name || '',
        race_date: report.race_date || '',
        title: report.title,
        author_name: report.author_name || '',
        content_md: report.content_md,
        photos: report.photos.join('; ')
      };
      console.log('Setting initial form data:', initialFormData);
      setFormData(initialFormData);
      // Mark initial load as complete after setting form data
      setIsInitialLoad(false);
    } else if (mode === 'create') {
      setIsInitialLoad(false);
    }
  }, [report, mode]);

  // Debug formData changes
  useEffect(() => {
    if (mode === 'edit') {
      console.log('Form data updated:', formData);
    }
  }, [formData, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.race_id && !/^\d+$/.test(formData.race_id)) {
      newErrors.race_id = 'Race ID must be a number';
    }

    // Validate that race_id exists in database if provided
    if (formData.race_id && formData.race_id.trim() !== '') {
      const raceId = parseInt(formData.race_id);
      if (!isNaN(raceId)) {
        const race = racesList.find(r => r.id === raceId);
        if (!race) {
          newErrors.race_id = 'Race ID must exist in database or be left empty';
        }
      }
    }

    if (!formData.race_date) {
      newErrors.race_date = 'Race date is required';
    }

    if (!formData.race_name.trim()) {
      newErrors.race_name = 'Race name is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 120) {
      newErrors.title = 'Title must be less than 120 characters';
    }

    if (!formData.content_md.trim()) {
      newErrors.content_md = 'Content is required';
    } else if (formData.content_md.trim().length < 10) {
      newErrors.content_md = 'Content must be at least 10 characters';
    } else if (formData.content_md.trim().length > 20000) {
      newErrors.content_md = 'Content must be less than 20,000 characters';
    }

    if (formData.author_name.trim() && formData.author_name.trim().length < 2) {
      newErrors.author_name = 'Author name must be at least 2 characters if provided';
    } else if (formData.author_name.trim().length > 80) {
      newErrors.author_name = 'Author name must be less than 80 characters';
    }

    // Validate photos (semicolon-separated URLs)
    if (formData.photos.trim()) {
      const photoUrls = formData.photos.split(';').map(p => p.trim()).filter(p => p);
      for (const url of photoUrls) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          newErrors.photos = 'All photo URLs must be absolute (http:// or https://)';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const photos = formData.photos.trim() 
      ? formData.photos.split(';').map(p => p.trim()).filter(p => p)
      : [];

    onSubmit({
      race_id: formData.race_id ? parseInt(formData.race_id) : null,
      race_name: formData.race_name.trim() || null,
      race_date: formData.race_date ? new Date(formData.race_date).toISOString() : null,
      title: formData.title.trim(),
      author_name: formData.author_name.trim() || null,
      content_md: formData.content_md.trim(),
      photos
    });
  };

  const renderMarkdownPreview = (markdown: string) => {
    // Simple markdown preview for MVP
    return markdown
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index} style={{ fontSize: '18px', margin: '12px 0 6px 0', color: '#333' }}>{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} style={{ fontSize: '20px', margin: '12px 0 8px 0', color: '#333' }}>{line.substring(2)}</h1>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={index} style={{ fontWeight: 'bold' }}>{line.substring(2, line.length - 2)}</strong>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} style={{ margin: '6px 0', lineHeight: '1.4', color: '#333' }}>{line}</p>;
      });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header - Fixed */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          flexShrink: 0
        }}>
          <h2 style={{ 
            margin: '0 0 4px 0', 
            color: '#111827',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {mode === 'create' ? 'Create New Race Report' : 'Edit Race Report'}
          </h2>
          {mode === 'edit' && report && (
            <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}>
              Report ID: {report.id}
            </p>
          )}
          <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>
            {mode === 'create' ? 'Add a new race report with markdown content.' : 'Update the race report details.'}
          </p>
        </div>

        {/* Form Content - Scrollable */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '20px',
          paddingBottom: '0'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'grid', gap: '16px', flex: 1 }}>
              {/* Top Row - Race ID and Race Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Race ID Input */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Race ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter race ID (optional)"
                    value={formData.race_id}
                    onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.race_id ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {errors.race_id && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                      {errors.race_id}
                    </p>
                  )}
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                    Leave empty for no race association. Enter a number to link to an existing race.
                  </p>
                  {formData.race_id && racesList.find(r => r.id === parseInt(formData.race_id)) && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#10b981' }}>
                      ✓ Valid race ID - race name will be auto-populated
                    </p>
                  )}
                  {formData.race_id && !racesList.find(r => r.id === parseInt(formData.race_id)) && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#f59e0b' }}>
                      ⚠️ Race ID not found in database
                    </p>
                  )}
                </div>

                {/* Race Name Input */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Race Name *
                    {formData.race_id && racesList.find(r => r.id === parseInt(formData.race_id)) && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', fontWeight: '400' }}>
                        (Auto-populated)
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Enter race name"
                      value={formData.race_name}
                      onChange={(e) => setFormData({ ...formData, race_name: e.target.value })}
                      disabled={formData.race_id && racesList.find(r => r.id === parseInt(formData.race_id))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        paddingRight: '80px',
                        border: errors.race_name ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s ease',
                        backgroundColor: (formData.race_id && racesList.find(r => r.id === parseInt(formData.race_id))) ? '#f3f4f6' : 'white',
                        cursor: (formData.race_id && racesList.find(r => r.id === parseInt(formData.race_id))) ? 'not-allowed' : 'text'
                      }}
                    />
                    {formData.race_name && formData.race_id && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, race_name: '' }))}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '2px 6px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}
                        title="Clear race name"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {errors.race_name && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                      {errors.race_name}
                    </p>
                  )}
                  {formData.race_id && formData.race_name && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#3b82f6' }}>
                      ✓ Auto-populated from linked race (field locked)
                    </p>
                  )}
                  {formData.race_id && !formData.race_name && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#f59e0b' }}>
                      ⚠️ Race ID not found - please enter a valid race name
                    </p>
                  )}
                  {!formData.race_id && formData.race_name && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                      Custom race name (no race association)
                    </p>
                  )}
                </div>

                {/* Race Date Input */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Race Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.race_date}
                    onChange={(e) => setFormData({ ...formData, race_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.race_date ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {errors.race_date && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                      {errors.race_date}
                    </p>
                  )}
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                    Required field
                  </p>
                </div>
              </div>

              {/* Second Row - Title and Author */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter report title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.title ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {errors.title && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Author Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter author name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: errors.author_name ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {errors.author_name && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                      {errors.author_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Photo URLs
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/photo1.jpg; https://example.com/photo2.jpg"
                  value={formData.photos}
                  onChange={(e) => setFormData({ ...formData, photos: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: errors.photos ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {errors.photos && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.photos}
                  </p>
                )}
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                  Separate multiple URLs with semicolons
                </p>
              </div>

              {/* Content Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    Content (Markdown) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: showPreview ? '#3b82f6' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
                
                {!showPreview && (
                  <textarea
                    placeholder="Enter markdown content...&#10;&#10;## Race Summary&#10;Write about the race experience...&#10;&#10;**Highlights:**&#10;- What went well&#10;- Key moments&#10;- Results"
                    value={formData.content_md}
                    onChange={(e) => setFormData({ ...formData, content_md: e.target.value })}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: errors.content_md ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      lineHeight: '1.4',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                )}
                
                {showPreview && (
                  <div style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    minHeight: '150px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    lineHeight: '1.5'
                  }}>
                    {renderMarkdownPreview(formData.content_md)}
                  </div>
                )}
                
                {errors.content_md && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.content_md}
                  </p>
                )}
                
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                  Supports markdown: **bold**, ## headings, lists, etc. Content must be 10-20,000 characters.
                </p>
              </div>
            </div>

            {/* Form Actions - Fixed at Bottom */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {mode === 'create' ? 'Create Report' : 'Update Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
