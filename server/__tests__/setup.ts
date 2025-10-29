import dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Add TextEncoder and TextDecoder to global scope for Node.js compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// This file is just for setup, no tests needed
describe('Test Setup', () => {
  it('should load test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});