// Test setup file
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(() => ({
        createIndex: jest.fn(),
      })),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          get: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          getAll: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          delete: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          clear: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
        })),
      })),
    },
  })),
  deleteDatabase: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
  })),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
});

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  writable: true,
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 1024 * 1024 * 100, // 100MB
    }),
  },
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
