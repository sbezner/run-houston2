export interface Race {
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
}
