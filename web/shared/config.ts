// Test-compatible config that avoids import.meta for Jest compatibility
export const config = {
  API_BASE: 'http://localhost:8000',
  API_PATH: '/api/v1',  // Only major version in path
  APP_VERSION: '1.0.0',
  BUILD_HASH: 'dev',
  BUILD_DATE: new Date().toISOString()
};

// Backward compatibility
export const API_BASE = config.API_BASE;
