export type Race = {
  id: number;
  name: string;
  date: string;
  start_time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  surface?: string;
  kid_run?: boolean;
  official_website_url?: string;
  latitude?: number;
  longitude?: number;
};

export type RaceSummary = {
  id: number;
  name: string;
  date: string;
  city?: string;
  state?: string;
  surface?: string;
  latitude?: number;
  longitude?: number;
  official_website_url?: string;
};

export type RaceReport = {
  id: number;
  race_id: number;
  race_date: string;  // YYYY-MM-DD format
  title: string;
  author_name?: string | null;
  content_md: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  // Optional race summary when include_race=true
  race?: RaceSummary;
};

export type RaceReportsResponse = {
  items: RaceReport[];
  total: number;
  limit: number;
  offset: number;
};
