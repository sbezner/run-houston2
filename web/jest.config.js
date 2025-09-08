export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/main/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        module: 'esnext',
        target: 'es2020',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
      },
    }],
  },
  testMatch: [
    '<rootDir>/main/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/main/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/admin/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/admin/src/**/*.{test,spec}.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'main/src/**/*.{ts,tsx}',
    'admin/src/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/main.tsx',
    '!**/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
