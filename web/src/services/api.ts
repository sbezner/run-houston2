import { API_BASE } from '../config';
import type { Club } from '../types';
import { networkValidator } from './networkValidator';

export const api = {
  get: async (endpoint: string, token?: string) => {
    // For admin endpoints, validate network connectivity
    if (token && endpoint.startsWith('/admin')) {
      const hasNetwork = await networkValidator.validateNetworkForAdmin();
      if (!hasNetwork) {
        throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (endpoint: string, data: any, token?: string) => {
    // For admin endpoints, validate network connectivity
    if (token && endpoint.startsWith('/admin')) {
      const hasNetwork = await networkValidator.validateNetworkForAdmin();
      if (!hasNetwork) {
        throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
      }
    }

    const headers: Record<string, string> = {};
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const body = data instanceof FormData ? data : JSON.stringify(data);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  put: async (endpoint: string, data: any, token?: string) => {
    // For admin endpoints, validate network connectivity
    if (token && endpoint.startsWith('/admin')) {
      const hasNetwork = await networkValidator.validateNetworkForAdmin();
      if (!hasNetwork) {
        throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  delete: async (endpoint: string, token?: string) => {
    // For admin endpoints, validate network connectivity
    if (token && endpoint.startsWith('/admin')) {
      const hasNetwork = await networkValidator.validateNetworkForAdmin();
      if (!hasNetwork) {
        throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  download: async (url: string, token: string) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const response = await fetch(fullUrl, { 
      headers: { 
        Authorization: `Bearer ${token}` 
      } 
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clubs.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export const clubs = {
  list: () => api.get('/clubs'),
  adminList: (token: string) => api.get('/admin/clubs', token),
  create: (body: Partial<Club>, token: string) => api.post('/clubs', body, token),
  update: (id: number, body: Partial<Club>, token: string) => api.put(`/clubs/${id}`, body, token),
  remove: (id: number, token: string) => api.delete(`/clubs/${id}`, token),
  exportCsv: async (token: string) => {
    // Validate network connectivity before CSV export
    const hasNetwork = await networkValidator.validateNetworkForAdmin();
    if (!hasNetwork) {
      throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
    }
    
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/clubs/export-csv`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) throw new Error(`Export failed with status ${res.status}`);
      return res.blob();
    });
  },
  importCsv: async (file: File, token: string) => {
    // Validate network connectivity before CSV import
    const hasNetwork = await networkValidator.validateNetworkForAdmin();
    if (!hasNetwork) {
      throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/clubs/import-csv`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
};

export const raceReports = {
  list: (params?: {
    race_id?: number;
    q?: string;
    date_from?: string;
    date_to?: string;
    order_by?: 'created_at' | 'race_date';
    limit?: number;
    offset?: number;
    include_race?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.race_id) searchParams.append('race_id', params.race_id.toString());
    if (params?.q) searchParams.append('q', params.q);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.include_race) searchParams.append('include_race', params.include_race.toString());
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/race_reports?${queryString}` : '/race_reports';
    return api.get(endpoint);
  },
  
  getById: (id: number, includeRace?: boolean) => {
    const endpoint = includeRace ? `/race_reports/${id}?include_race=true` : `/race_reports/${id}`;
    return api.get(endpoint);
  },
  
  create: (body: any, token: string) => api.post('/race_reports', body, token),
  update: (id: number, body: any, token: string) => api.put(`/race_reports/${id}`, body, token),
  remove: (id: number, token: string) => api.delete(`/race_reports/${id}`, token),
  
  exportCsv: async (token: string, params?: {
    race_id?: number;
    q?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    // Validate network connectivity before CSV export
    const hasNetwork = await networkValidator.validateNetworkForAdmin();
    if (!hasNetwork) {
      throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
    }
    
    const searchParams = new URLSearchParams();
    if (params?.race_id) searchParams.append('race_id', params.race_id.toString());
    if (params?.q) searchParams.append('q', params.q);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/race_reports/export.csv?${queryString}` : '/race_reports/export.csv';
    
    const fullUrl = `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${endpoint}`;
    
    return fetch(fullUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) {
        // Try to get error details from response
        return res.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || `Export failed with status ${res.status}`);
          } catch {
            throw new Error(`Export failed with status ${res.status}: ${text}`);
          }
        });
      }
      return res.blob();
    });
  },
  
  importCsv: async (file: File, dryRun: boolean = true, token: string) => {
    // Validate network connectivity before CSV import
    const hasNetwork = await networkValidator.validateNetworkForAdmin();
    if (!hasNetwork) {
      throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', dryRun.toString());
    
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/race_reports/import?dry_run=${dryRun}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
};

export const races = {
  list: () => api.get('/races'),
  adminList: (token: string) => api.get('/admin/races', token),
  getById: (id: number) => api.get(`/races/${id}`),
  create: (body: any, token: string) => api.post('/races', body, token),
  update: (id: number, body: any, token: string) => api.put(`/races/${id}`, body, token),
  remove: (id: number, token: string) => api.delete(`/races/${id}`, token),
  importCsv: async (file: File, token: string) => {
    // Validate network connectivity before CSV import
    const hasNetwork = await networkValidator.validateNetworkForAdmin();
    if (!hasNetwork) {
      throw new Error('Network connectivity required for admin operations. Please check your internet connection and try again.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/races/import`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
};
