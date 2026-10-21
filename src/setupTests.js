// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom lacks these browser APIs used by framer-motion and the navbar.
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.matchMedia =
  window.matchMedia ||
  (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
global.fetch = jest.fn(() => new Promise(() => {}));
