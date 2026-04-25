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

// crypto.subtle absent de jsdom — utiliser le webcrypto natif Node (≥ 16)
if (!global.crypto || !global.crypto.subtle) {
  const { webcrypto } = await import('node:crypto');
  global.crypto = webcrypto;
}
