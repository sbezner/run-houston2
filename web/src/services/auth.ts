export const auth = {
  getToken: (): string | null => {
    return sessionStorage.getItem('access_token');
  },
  
  setToken: (token: string): void => {
    sessionStorage.setItem('access_token', token);
  },
  
  removeToken: (): void => {
    sessionStorage.removeItem('access_token');
  },
  
  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem('access_token');
  },
};
