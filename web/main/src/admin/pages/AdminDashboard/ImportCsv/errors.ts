export type Surface = "road" | "trail" | "track" | "virtual" | "other";

export interface CsvRow {
  id?: string | null;
  name?: string;
  date?: string;
  start_time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  surface?: string;
  distance?: string;
  kid_run?: string;
  official_website_url?: string;
  official_w?: string;
  source?: string;
  latitude?: string;
  longitude?: string;
}

export type RaceCsvRow = CsvRow;

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  originalValue: string;
}

export interface NormalizedRow {
  id?: number;
  name: string;
  date: string;
  start_time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  surface: string;
  distance: string[];
  kid_run: boolean;
  official_website_url?: string;
  source?: string;
  latitude?: number;
  longitude?: number;
}

export type RaceUpsert = Omit<import('@shared/types').Race, 'id'> & { id?: number };

export type ImportError = {
  rowIndex: number;                      // 1-based excluding header
  field: keyof RaceUpsert | "row";
  code: "REQUIRED" | "INVALID_DATE" | "INVALID_TIME" | "INVALID_URL" | "OUT_OF_RANGE" | "HEADER_MISSING" | "DUPLICATE" | "PARSE_ERROR" | "INCONSISTENT_COORDS" | "INVALID_SURFACE" | "INVALID_DISTANCE" | "INVALID_KID_RUN" | "INVALID_LATITUDE" | "INVALID_LONGITUDE";
  message: string;
  originalValue?: string;
  hint?: string;
};

export type ImportStats = {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
};

export type ValidationResult = {
  valid: RaceUpsert[];
  errors: ImportError[];
  warnings: ImportError[];
  stats: ImportStats;
};

export type HeaderValidationResult = {
  isValid: boolean;
  missingHeaders: string[];
  errors: ImportError[];
};
