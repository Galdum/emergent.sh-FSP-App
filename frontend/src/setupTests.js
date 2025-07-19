// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock browser APIs that are not available in Jest environment
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock window.scrollIntoView
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});

// Suppress console warnings for specific messages
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillUpdate') ||
     args[0].includes('ReactDOM.render') ||
     args[0].includes('Warning: ReactDOM.render is deprecated'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 0;
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,';
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }
  
  readAsText() {
    setTimeout(() => {
      this.result = 'mocked file content';
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }
};