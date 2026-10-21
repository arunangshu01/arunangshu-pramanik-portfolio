import { renderHook, waitFor } from "@testing-library/react";
import { isRetryable, useApi } from "./useApi";

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });
const fast = { retryDelays: [0, 0, 0], slowAfter: 10_000 };

test("returns data on success", async () => {
  const { result } = renderHook(() => useApi(() => Promise.resolve({ ok: 1 }), fast));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.data).toEqual({ ok: 1 }));
  expect(result.current).toMatchObject({ loading: false, error: null, slow: false });
});

test("retries cold-start failures (503, network) and then succeeds", async () => {
  const fetcher = jest
    .fn()
    .mockRejectedValueOnce(httpError(503))
    .mockRejectedValueOnce(new TypeError("Failed to fetch"))
    .mockResolvedValue("data");
  const { result } = renderHook(() => useApi(fetcher, fast));
  await waitFor(() => expect(result.current.data).toBe("data"));
  expect(fetcher).toHaveBeenCalledTimes(3);
});

test("does not retry real errors like 404/422", async () => {
  const fetcher = jest.fn().mockRejectedValue(httpError(422));
  const { result } = renderHook(() => useApi(fetcher, fast));
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(false);
});

test("gives up after the configured retries", async () => {
  const fetcher = jest.fn().mockRejectedValue(httpError(502));
  const { result } = renderHook(() => useApi(fetcher, fast));
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(fetcher).toHaveBeenCalledTimes(4);
});

test("flags slow loads so the UI can explain the cold start", async () => {
  const { result } = renderHook(() =>
    useApi(() => new Promise(() => {}), { slowAfter: 20 })
  );
  expect(result.current.slow).toBe(false);
  await waitFor(() => expect(result.current.slow).toBe(true));
  expect(result.current.loading).toBe(true);
});

test("isRetryable only matches cold-start style failures", () => {
  expect(isRetryable(httpError(502))).toBe(true);
  expect(isRetryable(httpError(503))).toBe(true);
  expect(isRetryable(httpError(504))).toBe(true);
  expect(isRetryable(new TypeError("Failed to fetch"))).toBe(true);
  expect(isRetryable(httpError(404))).toBe(false);
  expect(isRetryable(httpError(500))).toBe(false);
  expect(isRetryable(new SyntaxError("bad json"))).toBe(false);
});
