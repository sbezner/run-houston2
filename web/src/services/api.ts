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
