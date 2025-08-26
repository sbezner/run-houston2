import React from 'react';
import type { Race } from '../types';
import { races } from '../services/api';

export const useRaces = () => {
  const [racesList, setRaces] = React.useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchAdminRaces = React.useCallback(async () => {
    setRacesLoading(true);
    try {
      const data = await races.list();
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
      const data = await races.list();
      setRaces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRacesLoading(false);
    }
  }, []);

  const createRace = React.useCallback(async (raceData: any) => {
    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';
      const data = await races.create(raceData, adminSecret);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  const updateRace = React.useCallback(async (raceId: number, raceData: any) => {
    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';
      const data = await races.update(raceId, raceData, adminSecret);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  const deleteRace = React.useCallback(async (raceId: number) => {
    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET || 'default-admin-secret';
      await races.remove(raceId, adminSecret);
      await fetchAdminRaces();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchAdminRaces]);

  return {
    races: racesList,
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
