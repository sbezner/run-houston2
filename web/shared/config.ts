// Environment-aware config with safe defaults for development
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const API_PATH = import.meta.env.VITE_API_PATH || "/api/v1";  // Now env-driven with fallback

export const config = {
  API_BASE,
  API_PATH,
  APP_NAME: import.meta.env.VITE_APP_NAME || "Run Houston",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "dev",
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || "development",
  BUILD_HASH: import.meta.env.VITE_BUILD_HASH || "local",
  BUILD_DATE: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  API_VERSION: import.meta.env.VITE_API_VERSION || "v1.0.0",
};

// Backward compatibility
export { API_BASE, API_PATH };

