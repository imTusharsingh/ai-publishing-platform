/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/test/setup.ts'],
};
