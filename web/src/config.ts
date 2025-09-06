export const config = {
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:8000',
  API_PATH: '/api/v1',  // Only major version in path
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  BUILD_HASH: import.meta.env.VITE_BUILD_HASH || 'dev',
  BUILD_DATE: import.meta.env.VITE_BUILD_DATE || new Date().toISOString()
};

// Backward compatibility
export const API_BASE = config.API_BASE;
