// Polyfills for React Native test environment

// Prevent window redefinition issues by setting up before React Native Jest setup
if (typeof global.window !== 'undefined') {
  // Preserve existing window if it exists
  global.originalWindow = global.window;
}

// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// AbortController polyfill  
if (typeof global.AbortController === 'undefined') {
  global.AbortController = require('abort-controller').AbortController;
}

// URL polyfill
if (typeof global.URL === 'undefined') {
  const { URL, URLSearchParams } = require('url');
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

// Set up fake timers
jest.useFakeTimers();