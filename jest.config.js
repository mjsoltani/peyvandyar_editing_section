module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/server', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  collectCoverageFrom: [
    'server/**/*.ts',
    'src/**/*.{ts,tsx}',
    '!server/**/*.d.ts',
    '!server/migrations/**',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.ts', '<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};