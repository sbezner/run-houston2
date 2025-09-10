export interface ClubCsvRow {
  id?: string | null;
  club_name?: string;
  location?: string;
  website_url?: string;
  description?: string;
}

export interface ClubUpsert {
  id?: number | null;
  club_name: string;
  location?: string | null;
  website_url?: string | null;
  description?: string | null;
}

export interface ImportError {
  rowIndex: number;
  field: string;
  code: string;
  message: string;
  hint?: string;
}

export interface HeaderValidationResult {
  isValid: boolean;
  missingHeaders: string[];
  errors: ImportError[];
}

export interface ValidationResult {
  valid: ClubUpsert[];
  errors: ImportError[];
  warnings: ImportError[];
  willUpdate: ClubUpsert[];
  willCreate: ClubUpsert[];
  willSkip: ClubUpsert[];
}
