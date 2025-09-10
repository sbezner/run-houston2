export interface RaceReportCsvRow {
  id?: string | null;
  race_id?: string;
  race_name?: string;
  race_date?: string;
  title?: string;
  author_name?: string;
  content_md?: string;
  photos?: string;
}

export interface RaceReportUpsert {
  id?: number | null;
  race_id?: number | null;
  race_name: string;
  race_date: string;
  title: string;
  author_name?: string | null;
  content_md: string;
  photos?: string[] | null;
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
  valid: RaceReportUpsert[];
  errors: ImportError[];
  warnings: ImportError[];
  willUpdate: RaceReportUpsert[];
  willCreate: RaceReportUpsert[];
  willSkip: RaceReportUpsert[];
}
