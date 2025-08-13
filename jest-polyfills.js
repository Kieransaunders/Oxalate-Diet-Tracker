// Polyfills for React Native test environment

// TextEncoder/TextDecoder polyfill
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// AbortController polyfill
if (typeof global.AbortController === 'undefined') {
  global.AbortController = require('abort-controller').AbortController;
}

// Set up fake timers
jest.useFakeTimers();