import '@testing-library/jest-dom';

// Mock window.URL.createObjectURL for CSV export tests
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

// Mock document.createElement for CSV export tests
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
  })),
  writable: true,
});

// Mock document.body methods
Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock window properties that React DOM needs
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

Object.defineProperty(window, 'matchMedia', {
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }),
});

// Create a comprehensive mock for all vendor prefixes
const vendorPrefixes = {
  Webkit: {},
  Moz: {},
  ms: {},
  O: {},
};

// Mock all vendor prefix properties
Object.keys(vendorPrefixes).forEach(prefix => {
  // Animation
  Object.defineProperty(window, `${prefix}Animation`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // Transition
  Object.defineProperty(window, `${prefix}Transition`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // Transform
  Object.defineProperty(window, `${prefix}Transform`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // BackfaceVisibility
  Object.defineProperty(window, `${prefix}BackfaceVisibility`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // Perspective
  Object.defineProperty(window, `${prefix}Perspective`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransformOrigin
  Object.defineProperty(window, `${prefix}TransformOrigin`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransformStyle
  Object.defineProperty(window, `${prefix}TransformStyle`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransitionDelay
  Object.defineProperty(window, `${prefix}TransitionDelay`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransitionDuration
  Object.defineProperty(window, `${prefix}TransitionDuration`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransitionProperty
  Object.defineProperty(window, `${prefix}TransitionProperty`, {
    value: {},
    writable: true,
    configurable: true,
  });
  
  // TransitionTimingFunction
  Object.defineProperty(window, `${prefix}TransitionTimingFunction`, {
    value: {},
    writable: true,
    configurable: true,
  });
});

// Mock requestAnimationFrame and cancelAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: Function) => setTimeout(callback, 0),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
}));
