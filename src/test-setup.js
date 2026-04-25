import '@testing-library/jest-dom';

// Recharts utilise ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// matchMedia absent de jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// crypto.subtle absent de jsdom
if (!global.crypto) global.crypto = {};
if (!global.crypto.subtle) {
  global.crypto.subtle = {
    digest: async () => new ArrayBuffer(32),
  };
}
