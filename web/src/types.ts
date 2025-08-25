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
