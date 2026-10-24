import { act, render, screen } from "@testing-library/react";
import ViewCounter from "./ViewCounter";
import { getViewStats, updateViewPresence } from "../api";

jest.mock("../api", () => ({
  ANALYTICS_ENABLED: true,
  getViewStats: jest.fn(),
  updateViewPresence: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  require("../api").ANALYTICS_ENABLED = true;
  updateViewPresence.mockReset();
  getViewStats.mockReset();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: { randomUUID: jest.fn(() => "44afd753-43e4-4dd6-b1ec-6639c36d15cb") },
  });
  sessionStorage.clear();
});

afterEach(() => jest.useRealTimers());

test("does not register views when analytics is disabled", async () => {
  require("../api").ANALYTICS_ENABLED = false;
  getViewStats.mockResolvedValue({ total_views: 4, viewing_now: 0 });
  render(<ViewCounter />);
  await act(async () => {});
  expect(updateViewPresence).not.toHaveBeenCalled();
  expect(screen.getByText(/4 total views/)).toBeInTheDocument();
});

test("aborts pending requests and clears timers on unmount", async () => {
  updateViewPresence.mockImplementation(() => new Promise(() => {}));
  const { unmount } = render(<ViewCounter />);
  const signal = updateViewPresence.mock.calls[0][2];
  unmount();
  expect(signal.aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});

test("backs off after a rate-limit response", async () => {
  updateViewPresence.mockRejectedValue(Object.assign(new Error("limited"), { status: 429 }));
  render(<ViewCounter />);
  await act(async () => {});
  await act(async () => jest.advanceTimersByTime(30000));
  expect(updateViewPresence).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(30000));
  expect(updateViewPresence).toHaveBeenCalledTimes(2);
});

test("shows aggregate counts and keeps IDs stable across heartbeats", async () => {
  updateViewPresence.mockResolvedValue({ total_views: 1234, viewing_now: 2 });
  const { unmount } = render(<ViewCounter />);
  await act(async () => {});
  expect(screen.getByText(/1,234/)).toBeInTheDocument();
  expect(screen.getByText(/2 viewing now/)).toBeInTheDocument();
  const first = updateViewPresence.mock.calls[0];
  await act(async () => jest.advanceTimersByTime(30000));
  expect(updateViewPresence).toHaveBeenCalledTimes(2);
  expect(updateViewPresence.mock.calls[1].slice(0, 2)).toEqual(first.slice(0, 2));
  unmount();
  await act(async () => jest.advanceTimersByTime(30000));
  expect(updateViewPresence).toHaveBeenCalledTimes(2);
});

test("pauses hidden tabs and resumes with the same view ID", async () => {
  updateViewPresence.mockResolvedValue({ total_views: 1, viewing_now: 1 });
  render(<ViewCounter />);
  await act(async () => {});
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await act(async () => jest.advanceTimersByTime(60000));
  expect(updateViewPresence).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(updateViewPresence).toHaveBeenCalledTimes(2);
  expect(updateViewPresence.mock.calls[1][0]).toEqual(updateViewPresence.mock.calls[0][0]);
});

test("degrades gracefully and recovers without showing a false zero", async () => {
  updateViewPresence.mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ total_views: 9, viewing_now: 1 });
  render(<ViewCounter />);
  await act(async () => {});
  expect(screen.getByText(/View stats unavailable/)).toBeInTheDocument();
  await act(async () => jest.advanceTimersByTime(30000));
  expect(screen.getByText(/9 total views/)).toBeInTheDocument();
});
