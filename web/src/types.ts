export interface Race {
  id: number;
  name: string;
  date: string;
  start_time?: string;
  tz?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  geom?: string;
  surface?: string;
  distance?: string[];
  kid_run?: boolean;
  official_website_url?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Club {
  id: number;
  club_name: string;
  location?: string;
  website_url?: string;
}

export interface RaceSummary {
  id: number;
  name: string;
  date: string;
  city?: string;
  state?: string;
  surface?: string;
  latitude?: number;
  longitude?: number;
  official_website_url?: string;
}

export interface RaceReport {
  id: number;
  race_id: number | null;  // Can be null for orphaned reports
  race_name: string;  // Race name stored directly in reports
  race_date: string;  // User-provided date, always required
  title: string;
  author_name?: string | null;
  content_md: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  // Optional race summary when include_race=true
  race?: RaceSummary;
}

export interface RaceReportsResponse {
  items: RaceReport[];
  total: number;
  limit: number;
  offset: number;
}
