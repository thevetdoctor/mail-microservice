import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
