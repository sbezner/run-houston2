export type Surface = "road" | "trail" | "track" | "mixed";

export type RaceCsvRow = {
  id?: string;
  name?: string;
  date?: string;
  start_time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  surface?: string;
  kid_run?: string;
  official_website_url?: string;
  latitude?: string;
  longitude?: string;
};

export type RaceUpsert = {
  id?: number;
  name: string;
  date: string;        // ISO YYYY-MM-DD
  start_time: string;  // HH:mm:ss
  address?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  surface: Surface;
  kid_run: boolean;
  official_website_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ImportError = {
  rowIndex: number;                      // 1-based excluding header
  field: keyof RaceUpsert | "row";
  code: "REQUIRED" | "INVALID_DATE" | "INVALID_TIME" | "INVALID_URL" | "OUT_OF_RANGE" | "HEADER_MISSING" | "DUPLICATE" | "PARSE_ERROR" | "INCONSISTENT_COORDS";
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
