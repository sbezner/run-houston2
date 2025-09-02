import { Race, RaceVM } from '../types';

export function normalizeRace(race: Race): RaceVM {
  return {
    id: race.id,
    name: race.name,
    dateISO: race.date,
    startTime: race.start_time || null,
    city: race.city || null,
    state: race.state || null,
    address: race.address || null,
    zip: race.zip || null,
    surface: race.surface ? race.surface.toLowerCase() : null,
    distances: race.distance || [],
    url: race.official_website_url || null,
    latitude: race.latitude || null,
    longitude: race.longitude || null,
    kidRun: race.kid_run || null,
  };
}
