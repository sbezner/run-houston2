import React from 'react';
import type { Race } from '../types';
import { auth } from '../services/auth';
import { api } from '../services/api';

export const useRaces = () => {
  const [races, setRaces] = React.useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchAdminRaces = React.useCallback(async () => {
    setRacesLoading(true);
    try {
      const token = auth.getToken();
      const data = await api.get('/admin/races', token || undefined);
      setRaces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRacesLoading(false);
    }
  }, []);

  const fetchPublicRaces = React.useCallback(async () => {
    setRacesLoading(true);
    try {
      const data = await api.get('/races');
      setRaces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRacesLoading(false);
    }
  }, []);

  const createRace = React.useCallback(async (raceData: any) => {
    try {
      const token = auth.getToken();
      const data = await api.post('/races', raceData, token || undefined);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  const updateRace = React.useCallback(async (raceId: number, raceData: any) => {
    try {
      const token = auth.getToken();
      const data = await api.put(`/races/${raceId}`, raceData, token || undefined);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  const deleteRace = React.useCallback(async (raceId: number) => {
    try {
      const token = auth.getToken();
      await api.delete(`/races/${raceId}`, token || undefined);
      await fetchAdminRaces();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  return {
    races,
    racesLoading,
    error,
    setError,
    fetchAdminRaces,
    fetchPublicRaces,
    createRace,
    updateRace,
    deleteRace,
  };
};
