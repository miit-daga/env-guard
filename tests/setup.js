// Test setup file for Jest
// This file runs before all tests

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Mock console.log to reduce noise in test output
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock process.env to ensure clean test environment
const originalProcessEnv = process.env;

beforeEach(() => {
  // Clear process.env before each test
  Object.keys(process.env).forEach(key => {
    if (key !== 'PATH' && key !== 'PWD' && key !== 'HOME') {
      delete process.env[key];
    }
  });
});

afterEach(() => {
  // Restore process.env
  process.env = originalProcessEnv;
});