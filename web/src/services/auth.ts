export const auth = {
  getToken: (): string | null => {
    return sessionStorage.getItem('adminToken');
  },
  
  setToken: (token: string): void => {
    sessionStorage.setItem('adminToken', token);
  },
  
  removeToken: (): void => {
    sessionStorage.removeItem('adminToken');
  },
  
  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem('adminToken');
  },
};
