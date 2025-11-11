// Vitest setup file for Vue 2 + Nuxt 2
import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock Nuxt context and helpers
global.$nuxt = {
  context: {
    env: {
      API_URL: 'http://localhost:8000',
      HOST: 'localhost',
      HPC_DATASTORE_ROOT: '/test/datastore',
    },
  },
};

// Mock common Nuxt plugins
config.mocks = {
  $config: {
    API_URL: 'http://localhost:8000',
    HOST: 'localhost',
  },
  $axios: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    $get: vi.fn(),
    $post: vi.fn(),
    $put: vi.fn(),
    $delete: vi.fn(),
  },
  $auth: {
    loggedIn: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  },
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
  },
  $route: {
    path: '/',
    params: {},
    query: {},
  },
  $store: {
    state: {},
    getters: {},
    dispatch: vi.fn(),
    commit: vi.fn(),
  },
  localePath: vi.fn((path) => path),
};

// Suppress Nuxt warnings in tests
config.showDeprecationWarnings = false;

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Setup global test utilities
global.flushPromises = () => new Promise((resolve) => setImmediate(resolve));
