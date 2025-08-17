export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem('adminToken');
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('adminToken', token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem('adminToken');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('adminToken');
  },
};
