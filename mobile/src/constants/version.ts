/**
 * Version constants for the Run Houston mobile app
 * This file provides centralized version management and API compatibility checking
 */

export const VERSION = {
  // App version - should match system-release.json
  APP_VERSION: "1.0.0",
  
  // Database schema version - should match system-release.json
  DB_VERSION: "20250906_0537",
  
  // API compatibility requirements
  MIN_SUPPORTED_API_MAJOR: 1,
  API_PATH: "/api/v1",
  
  // Build information (can be overridden by build process)
  BUILD_NUMBER: "1",
  BUILD_DATE: new Date().toISOString(),
  
  // System release (should match system-release.json)
  SYSTEM_RELEASE: "2025.09.R1"
} as const;

// Type for version info from API
export interface ApiVersionInfo {
  api_version: string;
  api_path_major: string;
  schema_version: string;
  system_release: string;
  deprecated: boolean;
  sunset_date: string | null;
  min_supported_api_major: number;
  min_supported_clients: {
    mobile: string;
    web: string;
  };
}

// Helper function to check API compatibility
export const isApiCompatible = (apiVersionInfo: ApiVersionInfo): boolean => {
  const apiMajorVersion = parseInt(apiVersionInfo.api_path_major.replace('v', ''));
  return apiMajorVersion >= VERSION.MIN_SUPPORTED_API_MAJOR;
};

// Helper function to get version display string
export const getVersionDisplayString = (): string => {
  return `${VERSION.APP_VERSION} (${VERSION.BUILD_NUMBER})`;
};

// Helper function to get full version info
export const getFullVersionInfo = () => {
  return {
    app: VERSION.APP_VERSION,
    build: VERSION.BUILD_NUMBER,
    db: VERSION.DB_VERSION,
    system: VERSION.SYSTEM_RELEASE,
    apiPath: VERSION.API_PATH,
    minSupportedApi: VERSION.MIN_SUPPORTED_API_MAJOR
  };
};
