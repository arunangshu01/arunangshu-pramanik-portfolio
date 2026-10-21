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

// @testing-library/react 13 triggers this deprecation on React 18.3; it's not
// actionable from app code, so keep it out of the output.
const consoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ReactDOMTestUtils.act')) return;
  consoleError(...args);
};
