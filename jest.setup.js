import '@testing-library/jest-dom';

// Polyfill for Next.js 13+ Request/Response
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this.body = options.body || null;
  }
  async json() {
    if (!this.body) return {};
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Headers(options.headers || {});
  }
  async json() {
    if (!this.body) return {};
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Headers = class Headers {
  constructor(init = {}) {
    this.map = new Map();
    if (init) {
      if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }
  }
  get(key) {
    return this.map.get(key.toLowerCase());
  }
  set(key, value) {
    this.map.set(key.toLowerCase(), value);
  }
};
