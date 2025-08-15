export type Race = {
  id: number;
  name: string;
  date: string;
  start_time?: string;
  city?: string;
  state?: string;
  surface?: string;
  kid_run?: boolean;
  official_website_url?: string;
  latitude: number;
  longitude: number;
};
