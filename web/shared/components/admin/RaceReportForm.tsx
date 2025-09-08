import React, { useState, useEffect } from 'react';
import type { RaceReport } from '@shared/types';
import { races } from '@shared/services/api';

interface RaceReportFormProps {
  report?: RaceReport;
  onSubmit: (reportData: any) => void;
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
    photos: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [raceLookupStatus, setRaceLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle');

  useEffect(() => {
    // Populate form if editing
    if (mode === 'edit' && report) {
      setFormData({
        race_id: report.race_id?.toString() || '',
        race_name: (report as any).race_name || '',
        race_date: report.race_date || '',
        title: report.title || '',
        author_name: report.author_name || '',
        content_md: report.content_md || '',
        photos: report.photos || []
      });
    }
  }, [mode, report]);

  // Lookup race name when race_id changes (but not when race_name is manually edited)
  useEffect(() => {
    const fetchRaceName = async () => {
      const idNum = parseInt(formData.race_id);
      if (!formData.race_id || Number.isNaN(idNum)) {
        setRaceLookupStatus('idle');
        return;
      }
      
      setRaceLookupStatus('loading');
      try {
        const response = await races.list();
        // API returns array directly, not wrapped in 'races' property
        const racesArray = Array.isArray(response) ? response : response.races || [];
        const race = racesArray.find((r: any) => r.id === idNum);
        if (race) {
          setFormData(prev => ({ ...prev, race_name: race.name }));
          setRaceLookupStatus('found');
        } else {
          // Clear race name when ID is not found
          setFormData(prev => ({ ...prev, race_name: '' }));
          setRaceLookupStatus('not-found');
        }
      } catch {
        // Clear race name on error
        setFormData(prev => ({ ...prev, race_name: '' }));
        setRaceLookupStatus('not-found');
      }
    };
    fetchRaceName();
  }, [formData.race_id]);

  // Also lookup race name when editing and race_id is already populated
  useEffect(() => {
    if (mode === 'edit' && report && report.race_id && !formData.race_name) {
      const fetchRaceName = async () => {
        const idNum = report.race_id;
        setRaceLookupStatus('loading');
        try {
          const response = await races.list();
          // API returns array directly, not wrapped in 'races' property
          const racesArray = Array.isArray(response) ? response : response.races || [];
          const race = racesArray.find((r: any) => r.id === idNum);
          if (race) {
            setFormData(prev => ({ ...prev, race_name: race.name }));
            setRaceLookupStatus('found');
          } else {
            // Clear race name when ID is not found
            setFormData(prev => ({ ...prev, race_name: '' }));
            setRaceLookupStatus('not-found');
          }
        } catch {
          // Clear race name on error
          setFormData(prev => ({ ...prev, race_name: '' }));
          setRaceLookupStatus('not-found');
        }
      };
      fetchRaceName();
    }
  }, [mode, report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: require either race_id OR race_name, but not both empty
    if ((!formData.race_id && !formData.race_name.trim()) || !formData.race_date || !formData.title || !formData.content_md) {
      setError('Please fill in all required fields');
      return;
    }

    // Prevent submission with invalid race ID
    if (formData.race_id && raceLookupStatus === 'not-found') {
      setError('Invalid race ID - no race found with that ID');
      return;
    }

    const reportData = {
      race_id: formData.race_id ? parseInt(formData.race_id) : null,
      race_name: formData.race_name.trim(),
      race_date: formData.race_date,
      title: formData.title.trim(),
      author_name: formData.author_name.trim() || null,
      content_md: formData.content_md.trim(),
      photos: formData.photos.filter(photo => photo.trim() !== '')
    };

    onSubmit(reportData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for race_name: if manually edited, clear race_id
    if (name === 'race_name' && value.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        race_name: value,
        race_id: '' // Clear ID when name is manually entered
      }));
      setRaceLookupStatus('idle');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.map((photo, i) => i === index ? value : photo)
    }));
  };

  const addPhotoField = () => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, '']
    }));
  };

  const removePhotoField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '960px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>
          {mode === 'create' ? 'Create Race Report' : 'Edit Race Report'}
        </h3>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              Tip: Use Markdown in content. Click Preview to review before saving.
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '8px 16px',
                backgroundColor: showPreview ? '#6b7280' : '#111827',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
          </div>

          {showPreview && (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ marginBottom: 8, color: '#374151' }}>
                <strong style={{ fontSize: 18 }}>{formData.title || '(Untitled)'}</strong>
              </div>
              <div style={{ marginBottom: 12, color: '#6b7280', fontSize: 13 }}>
                {formData.author_name ? `by ${formData.author_name} • ` : ''}{formData.race_date || 'No date'}
                {formData.race_name && ` • ${formData.race_name}`}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#111827', lineHeight: 1.6 }}>
                {formData.content_md || '(No content)'}
              </div>
              {formData.photos && formData.photos.length > 0 && (
                <div style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
                  Photos: {formData.photos.filter(p => p.trim() !== '').join(', ')}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Race Information *
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 120px' }}>
                <input
                  type="number"
                  name="race_id"
                  value={formData.race_id}
                  onChange={handleInputChange}
                  placeholder="Race ID"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: raceLookupStatus === 'not-found' ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {raceLookupStatus === 'loading' && (
                  <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                    Looking up...
                  </div>
                )}
                {raceLookupStatus === 'not-found' && (
                  <div style={{ marginTop: '4px', color: '#ef4444', fontSize: '12px' }}>
                    No race with that ID
                  </div>
                )}
                {raceLookupStatus === 'found' && (
                  <div style={{ marginTop: '4px', color: '#10b981', fontSize: '12px' }}>
                    ✓ Found
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="race_name"
                  value={formData.race_name}
                  onChange={handleInputChange}
                  placeholder="Race name (auto-filled from ID or enter manually)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  {formData.race_id ? 'Auto-filled from Race ID' : 'Enter race name manually'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Race Date *
            </label>
            <input
              type="date"
              name="race_date"
              value={formData.race_date}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              minLength={3}
              maxLength={120}
              placeholder="Enter report title"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Author Name
            </label>
            <input
              type="text"
              name="author_name"
              value={formData.author_name}
              onChange={handleInputChange}
              maxLength={80}
              placeholder="Enter author name (optional)"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Content (Markdown) *
            </label>
            <textarea
              name="content_md"
              value={formData.content_md}
              onChange={handleInputChange}
              required
              minLength={1}
              maxLength={20000}
              placeholder="Enter report content in Markdown format"
              rows={8}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Photos (URLs)
            </label>
            {formData.photos.map((photo, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="url"
                  value={photo}
                  onChange={(e) => handlePhotoChange(index, e.target.value)}
                  placeholder="Enter photo URL"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePhotoField(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPhotoField}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Photo URL
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {mode === 'create' ? 'Create Report' : 'Update Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};