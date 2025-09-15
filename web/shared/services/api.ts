import { API_BASE, config } from "../config";

export const api = {
  get: async (endpoint: string, token?: string) => {
    // No network validation - only authentication matters

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-App': config.APP_NAME,
      'X-Client-Version': config.APP_VERSION,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const fullUrl = `${API_BASE}${endpoint}`;
    console.log('Full API URL:', fullUrl);
    console.log('API_BASE:', API_BASE);
    console.log('endpoint:', endpoint);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async (endpoint: string, data: any, token?: string) => {
    // No network validation - only authentication matters

    const headers: Record<string, string> = {
      'X-Client-App': config.APP_NAME,
      'X-Client-Version': config.APP_VERSION,
    };
    
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
      
      // Try to get the error message from the response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  },
  
  put: async (endpoint: string, data: any, token?: string) => {
    const headers: Record<string, string> = {
      'X-Client-App': config.APP_NAME,
      'X-Client-Version': config.APP_VERSION,
    };
    
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const body = data instanceof FormData ? data : JSON.stringify(data);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  delete: async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      'X-Client-App': config.APP_NAME,
      'X-Client-Version': config.APP_VERSION,
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

export const races = {
  list: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    distanceCategory?: string;
    surface?: string;
    city?: string;
    kidFriendly?: boolean;
    q?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [k, v]) => {
            if (v === undefined || v === null || v === '') return acc;
            acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    const url = `/races${query}`;
    console.log('Making API call to:', url);
    return api.get(url);
  },
  
  adminList: async (token: string) => {
    return api.get('/admin/races', token);
  },
  
  get: async (id: number) => {
    return api.get(`/races/${id}`);
  },
  
  create: async (raceData: any, token: string) => {
    return api.post('/races', raceData, token);
  },
  
  update: async (id: number, raceData: any, token: string) => {
    return api.put(`/races/${id}`, raceData, token);
  },
  
  delete: async (id: number, token: string) => {
    return api.delete(`/races/${id}`, token);
  },
  
  
  importCsv: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/races/import', formData, token);
  },
  
  validateIds: async (raceIds: number[], token: string) => {
    return api.post('/admin/races/validate-ids', raceIds, token);
  }
};

export const clubs = {
  list: async () => {
    return api.get('/clubs');
  },
  
  adminList: async (token: string) => {
    return api.get('/admin/clubs', token);
  },
  
  get: async (id: number) => {
    return api.get(`/clubs/${id}`);
  },
  
  create: async (clubData: any, token: string) => {
    return api.post('/clubs', clubData, token);
  },
  
  update: async (id: number, clubData: any, token: string) => {
    return api.put(`/clubs/${id}`, clubData, token);
  },
  
  delete: async (id: number, token: string) => {
    return api.delete(`/clubs/${id}`, token);
  },
  
  exportCsv: async (token: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/admin/clubs/export-csv`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  },
  
  importCsv: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/admin/clubs/import-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  validateIds: async (clubIds: number[], token: string) => {
    return api.post('/admin/clubs/validate-ids', clubIds, token);
  }
};

export const raceReports = {
  list: async () => {
    return api.get('/race_reports');
  },
  
  get: async (id: string) => {
    return api.get(`/race_reports/${id}`);
  },
  
  getById: async (id: number, includeRace?: boolean) => {
    const params = includeRace ? '?include_race=true' : '';
    return api.get(`/race_reports/${id}${params}`);
  },
  
  create: async (reportData: any, token: string) => {
    return api.post('/race_reports', reportData, token);
  },
  
  update: async (id: string | number, reportData: any, token: string) => {
    return api.put(`/race_reports/${id}`, reportData, token);
  },
  
  delete: async (id: string | number, token: string) => {
    return api.delete(`/race_reports/${id}`, token);
  },
  
  exportCsv: async (token: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/race_reports/export.csv`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  },
  
  importCsv: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/admin/race_reports/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  validateIds: async (reportIds: number[], token: string) => {
    return api.post('/admin/race_reports/validate-ids', reportIds, token);
  }
};

export const auth = {
  login: async (username: string, password: string) => {
    return api.post('/admin/login', { username, password });
  },
  
  verify: async (token: string) => {
    return api.get('/admin/verify', token);
  },
  
};

export const monitoring = {
  getVersionMetrics: async () => {
    return api.get('/api/v1/monitoring/version-metrics');
  },
  
  getPerformanceMetrics: async () => {
    return api.get('/api/v1/monitoring/performance');
  },
  
  getDetailedHealth: async () => {
    return api.get('/api/v1/monitoring/health-detailed');
  }
};
