export interface Race {
  id: number;
  title: string;
  date: string;
  time: string;
  surface: string;
  distance: number;
  distance_unit: string;
  location: string;
  latitude: number;
  longitude: number;
  url?: string;
  description?: string;
}

export interface RaceReport {
  id: number;
  race_id: number;
  race_name: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
  url?: string;
}

export interface Club {
  id: number;
  club_name: string;
  location?: string;
  website_url?: string;
}
