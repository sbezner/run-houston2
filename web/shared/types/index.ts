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
  location?: string | null;
  website_url?: string | null;
  description?: string | null;
}

export interface RaceReport {
  id: number;
  race_id: number;
  race_name: string;
  race_date: string;
  title: string;
  author_name: string | null;
  content_md: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  race?: Race;
}

export interface RaceReportsResponse {
  items: RaceReport[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminLogin {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}

export interface VersionInfo {
  api_version: string;
  web_version: string;
  mobile_version: string;
  schema_version: string;
  system_release: string;
  api_path_major: string;
}

export interface VersionMetrics {
  total_requests: number;
  version_breakdown: Record<string, number>;
  client_breakdown: Record<string, number>;
  last_updated: string;
}

export interface PerformanceMetrics {
  average_response_time: number;
  total_requests: number;
  error_rate: number;
  uptime_percentage: number;
  last_updated: string;
}

export interface DetailedHealth {
  status: string;
  api_version: string;
  schema_version: string;
  system_release: string;
  uptime_seconds: number;
  total_api_calls: number;
  error_count: number;
  last_error?: string;
  api_call_breakdown: Record<string, number>;
}
