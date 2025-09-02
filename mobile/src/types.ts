export interface Race {
  id: number;
  name: string;
  date: string;
  start_time?: string;
  distance: string[];
  surface?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  kid_run?: boolean;
  official_website_url?: string;
}

export interface RaceVM {
  id: string | number;
  name: string;
  dateISO: string;         // YYYY-MM-DD
  startTime?: string | null; // HH:mm or HH:mm:ss optional
  city?: string | null;
  state?: string | null;
  surface?: string | null;   // road|trail|track
  distances?: string[];
  url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  kidRun?: boolean | null;
}

export interface RaceReport {
  id: number;
  race_id?: number;
  race_name?: string;
  title?: string;      // Title property
  content?: string;    // Content property
  author?: string;     // Author property
  url?: string;        // URL property
  content_md: string;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: number;
  name: string;
  club_name?: string;  // Alternative property name
  description?: string;
  website_url?: string;
  location?: string;   // Location property
  created_at: string;
  updated_at: string;
}

export type FilterState = {
  preset: "today" | "tomorrow" | "weekend" | "next7" | "next30" | "thisWeekend" | "next30Days" | "next90Days" | "last90Days" | "custom";
  dateFrom?: string; // YYYY-MM-DD when custom
  dateTo?: string;   // YYYY-MM-DD when custom
  distances: Array<"5k" | "10k" | "half marathon" | "marathon" | "ultra" | "other">;
  surface: Array<"road" | "trail" | "track">;
  useLocation: boolean;
  locationRadius: 5 | 10 | 25 | 50 | null;
  city: string; // "all" or a dynamic city name
};
