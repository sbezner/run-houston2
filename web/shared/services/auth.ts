import { auth as authApi } from './api';

export const auth = {
  login: async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      
      if (response.access_token) {
        localStorage.setItem('admin_token', response.access_token);
        return { success: true, token: response.access_token };
      } else {
        return { success: false, error: 'No token received' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
  },
  
  getToken: () => {
    return localStorage.getItem('admin_token');
  },
  
  setToken: (token: string) => {
    localStorage.setItem('admin_token', token);
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('admin_token');
    return !!token;
  },
  
  verifyToken: async () => {
    const token = auth.getToken();
    if (!token) {
      return { valid: false, error: 'No token found' };
    }
    
    try {
      await authApi.verify(token);
      return { valid: true };
    } catch (error: any) {
      auth.logout();
      return { 
        valid: false, 
        error: error.message || 'Token verification failed' 
      };
    }
  }
};
