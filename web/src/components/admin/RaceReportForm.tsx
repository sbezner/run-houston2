import React, { useState, useEffect } from 'react';
import type { RaceReport } from '../../types';

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
    title: '',
    author_name: '',
    race_date: '',
    content_md: '',
    photos: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (report && mode === 'edit') {
      setFormData({
        title: report.title,
        author_name: report.author_name || '',
        race_date: report.race_date,
        content_md: report.content_md,
        photos: report.photos.join('; ')
      });
    }
  }, [report, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 120) {
      newErrors.title = 'Title must be less than 120 characters';
    }

    if (!formData.race_date.trim()) {
      newErrors.race_date = 'Race date is required';
    }

    if (!formData.content_md.trim()) {
      newErrors.content_md = 'Content is required';
    } else if (formData.content_md.trim().length < 1) {
      newErrors.content_md = 'Content must be at least 1 character';
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
      title: formData.title.trim(),
      author_name: formData.author_name.trim() || null,
      race_date: formData.race_date.trim(),
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
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <h2 style={{ 
            margin: '0 0 6px 0', 
            color: '#111827',
            fontSize: '22px',
            fontWeight: '600'
          }}>
            {mode === 'create' ? 'Create New Race Report' : 'Edit Race Report'}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
            {mode === 'create' ? 'Add a new race report with markdown content.' : 'Update the race report details.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Top Row - Title and Author */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter report title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: errors.title ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {errors.title && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Author Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Author Name
                </label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: errors.author_name ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {errors.author_name && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.author_name}
                  </p>
                )}
              </div>
            </div>

            {/* Second Row - Race Date and Photos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              {/* Race Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Race Date *
                </label>
                <input
                  type="date"
                  value={formData.race_date}
                  onChange={(e) => setFormData({ ...formData, race_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: errors.race_date ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {errors.race_date && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.race_date}
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Photo URLs
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/photo1.jpg; https://example.com/photo2.jpg"
                  value={formData.photos}
                  onChange={(e) => setFormData({ ...formData, photos: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: errors.photos ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {errors.photos && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                    {errors.photos}
                  </p>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                  Content (Markdown) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: showPreview ? '#3b82f6' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
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
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
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
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#f9fafb',
                  minHeight: '200px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  lineHeight: '1.5'
                }}>
                  {renderMarkdownPreview(formData.content_md)}
                </div>
              )}
              
              {errors.content_md && (
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>
                  {errors.content_md}
                </p>
              )}
              
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                Supports markdown: **bold**, ## headings, lists, etc. Content must be 10-20,000 characters.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            marginBottom: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
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
                padding: '10px 20px',
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
  );
};
