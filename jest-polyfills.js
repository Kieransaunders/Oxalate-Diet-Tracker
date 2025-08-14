// Polyfills for React Native test environment

// Polyfills for React Native test environment

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

// Set up fake timers
jest.useFakeTimers();