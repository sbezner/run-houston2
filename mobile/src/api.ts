import { Race, RaceReport, Club } from './types';
import { config } from './config';

export const fetchRaces = async (): Promise<Race[]> => {
  try {
    const response = await fetch(`${config.backendUrl}/races`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching races:', error);
    throw error;
  }
};

export const fetchRaceReports = async (params: {
  limit?: number;
  offset?: number;
  race_id?: number;
} = {}): Promise<{
  items: RaceReport[];
  total: number;
  limit: number;
  offset: number;
}> => {
  try {
    const { limit = 20, offset = 0, race_id } = params;
    let url = `${config.backendUrl}/race_reports?limit=${limit}&offset=${offset}`;
    
    if (race_id) {
      url += `&race_id=${race_id}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching race reports:', error);
    throw error;
  }
};

export const fetchClubs = async (): Promise<Club[]> => {
  try {
    const response = await fetch(`${config.backendUrl}/clubs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }
};
