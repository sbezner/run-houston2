import React from 'react';
import type { Race } from "@shared/types";
import { races } from "@shared/services/api";
import { auth } from "@shared/services/auth";

export const useRaces = (onTokenExpiration?: () => void) => {
  const [racesList, setRaces] = React.useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchAdminRaces = React.useCallback(async () => {
    setRacesLoading(true);
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        return;
      }
      const data = await races.adminList(token);
      setRaces(data);
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message);
      }
    } finally {
      setRacesLoading(false);
    }
  }, [onTokenExpiration]);

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
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        throw new Error('No authentication token');
      }
      const data = await races.create(raceData, token);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message);
        throw err;
      }
    }
  }, [fetchAdminRaces, onTokenExpiration]);

  const updateRace = React.useCallback(async (raceId: number, raceData: any) => {
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        throw new Error('No authentication token');
      }
      const data = await races.update(raceId, raceData, token);
      await fetchAdminRaces();
      return data;
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message);
        throw err;
      }
    }
  }, [fetchAdminRaces, onTokenExpiration]);

  const deleteRace = React.useCallback(async (raceId: number) => {
    try {
      const token = auth.getToken();
      if (!token) {
        if (onTokenExpiration) {
          onTokenExpiration();
        } else {
          setError('No authentication token');
        }
        throw new Error('No authentication token');
      }
      await races.delete(raceId, token);
      await fetchAdminRaces();
    } catch (err: any) {
      if (err.message.includes('Your session has expired') && onTokenExpiration) {
        onTokenExpiration();
      } else {
        setError(err.message);
        throw err;
      }
    }
  }, [fetchAdminRaces, onTokenExpiration]);

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
