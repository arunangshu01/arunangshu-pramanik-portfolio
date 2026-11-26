import { act, render, screen } from "@testing-library/react";
import BootSequence from "./BootSequence";

// Passthrough mock: real framer-motion exit animations never finish in jsdom,
// which makes dismissal assertions timing-dependent.
jest.mock("framer-motion", () => {
  const React = require("react");
  const strip = ({
    initial,
    animate,
    exit,
    transition,
    whileInView,
    viewport,
    ...rest
  }) => rest;
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) =>
        function MotionComponent(props) {
          return React.createElement(tag, strip(props), props.children);
        },
    }
  );
  return { motion, AnimatePresence: ({ children }) => children };
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("shows backend wait status while the API is still loading", () => {
  render(<BootSequence ready={false} />);
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(
    screen.getByText(/Establishing connection to backend/)
  ).toBeInTheDocument();
});

test("dismisses once ready after the minimum visible time", () => {
  const { rerender } = render(<BootSequence ready={false} />);
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  rerender(<BootSequence ready={true} />);
  act(() => {
    jest.advanceTimersByTime(100);
  });
  expect(screen.queryByText(/J\.A\.R\.V\.I\.S\. OS/)).not.toBeInTheDocument();
});

test("dismisses after the cap even if the API never responds", () => {
  render(<BootSequence ready={false} />);
  act(() => {
    jest.advanceTimersByTime(21000);
  });
  expect(screen.queryByText(/J\.A\.R\.V\.I\.S\. OS/)).not.toBeInTheDocument();
});
