import { API_BASE } from "./config";
import { Race, RaceReport, RaceReportsResponse } from "./types";

export async function fetchRaces(): Promise<Race[]> {
  const res = await fetch(`${API_BASE}/races`);
  if (!res.ok) throw new Error(`Failed to fetch races: ${res.status}`);
  const data = (await res.json()) as Race[];
  
   

  const withCoords = data.filter(
    r => typeof r.latitude === "number" && typeof r.longitude === "number"
  );
  console.log("---")
  console.log("Races with coords (api.ts):", withCoords.length);


  // Only keep races that have coordinates
  return data.filter(
    r => typeof r.latitude === "number" && typeof r.longitude === "number"
  );
}

export async function fetchRaceReports(params?: {
  race_id?: number;
  q?: string;
  date_from?: string;
  date_to?: string;
  order_by?: 'created_at' | 'race_date';
  limit?: number;
  offset?: number;
  include_race?: boolean;
}): Promise<RaceReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.race_id) searchParams.append('race_id', params.race_id.toString());
  if (params?.q) searchParams.append('q', params.q);
  if (params?.date_from) searchParams.append('date_from', params.date_from);
  if (params?.date_to) searchParams.append('date_to', params.date_to);
  if (params?.order_by) searchParams.append('order_by', params.order_by);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.include_race) searchParams.append('include_race', params.include_race.toString());
  
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/race_reports?${queryString}` : '/race_reports';
  
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch race reports: ${res.status}`);
  return await res.json();
}

export async function fetchRaceReportById(id: number, includeRace?: boolean): Promise<RaceReport> {
  const endpoint = includeRace ? `/race_reports/${id}?include_race=true` : `/race_reports/${id}`;
  
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch race report: ${res.status}`);
  return await res.json();
}
