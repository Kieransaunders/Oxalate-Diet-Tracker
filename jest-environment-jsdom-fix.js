const JSDOMEnvironment = require('jest-environment-jsdom').default;

class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    const [config, context] = args;
    // Create the environment without React Native's window conflicts
    super({
      ...config,
      projectConfig: {
        ...config.projectConfig,
        testEnvironmentOptions: {
          ...config.projectConfig.testEnvironmentOptions,
          // Prevent window redefinition
          pretendToBeVisual: false,
        },
      },
    }, context);
  }

  async setup() {
    await super.setup();
    
    // Set up global properties that may be needed
    if (typeof this.global.URL === 'undefined') {
      const { URL, URLSearchParams } = require('url');
      this.global.URL = URL;
      this.global.URLSearchParams = URLSearchParams;
    }
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomJSDOMEnvironment;