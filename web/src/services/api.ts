import { API_BASE } from '../config';
import type { Club } from '../types';

export const api = {
  get: async (endpoint: string, token?: string) => {
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
  list: (token?: string) => api.get('/clubs', token),
  adminList: (token: string) => api.get('/admin/clubs', token),
  create: (body: Partial<Club>, token: string) => api.post('/clubs', body, token),
  update: (id: number, body: Partial<Club>, token: string) => api.put(`/clubs/${id}`, body, token),
  remove: (id: number, token: string) => api.delete(`/clubs/${id}`, token),
  exportCsv: (token: string) => api.download('/admin/clubs/export-csv', token),
  importCsv: (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/clubs/import-csv', formData, token);
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
  
  create: (body: any, adminSecret: string) => {
    const headers = { 'X-Admin-Secret': adminSecret };
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/race_reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
  
  update: (id: number, body: any, adminSecret: string) => {
    const headers = { 'X-Admin-Secret': adminSecret };
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/race_reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
  
  remove: (id: number, adminSecret: string) => {
    const headers = { 'X-Admin-Secret': adminSecret };
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/race_reports/${id}`, {
      method: 'DELETE',
      headers,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
  
  exportCsv: (params?: {
    race_id?: number;
    q?: string;
    date_from?: string;
    date_to?: string;
  }, adminSecret?: string) => {
    const searchParams = new URLSearchParams();
    if (params?.race_id) searchParams.append('race_id', params.race_id.toString());
    if (params?.q) searchParams.append('q', params.q);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/race_reports/export.csv?${queryString}` : '/race_reports/export.csv';
    
    const headers: Record<string, string> = {};
    if (adminSecret) {
      headers['X-Admin-Secret'] = adminSecret;
    }
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}${endpoint}`, {
      headers,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.blob();
    });
  },
  
  importCsv: (file: File, dryRun: boolean = true, adminSecret?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', dryRun.toString());
    
    const headers: Record<string, string> = {};
    if (adminSecret) {
      headers['X-Admin-Secret'] = adminSecret;
    }
    return fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/admin/race_reports/import?dry_run=${dryRun}`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });
  },
};
