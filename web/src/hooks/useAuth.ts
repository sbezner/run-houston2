import React from 'react';
import { auth } from '../services/auth';
import { api } from '../services/api';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const login = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/admin/login', { username, password });
      auth.setToken(data.access_token);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  const logout = React.useCallback(() => {
    auth.removeToken();
    setIsLoggedIn(false);
  }, []);

  const checkAuth = React.useCallback(() => {
    const token = auth.getToken();
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isLoggedIn,
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    login,
    logout,
  };
};
