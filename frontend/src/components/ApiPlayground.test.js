import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ApiPlayground, { ENDPOINTS } from "./ApiPlayground";
import { highlightJson } from "../jsonHighlight";

jest.mock("../api", () => ({
  ...jest.requireActual("../api"),
  rawGet: jest.fn(),
  trackEvent: jest.fn(),
}));

const api = require("../api");

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
});

const json = (body, status = 200) => ({
  status, ok: status < 400, ms: 42, contentType: "application/json",
  bytes: JSON.stringify(body).length, text: JSON.stringify(body),
});

test("only exposes read-only, non-admin endpoints", () => {
  const paths = ENDPOINTS.map((e) => e.path);
  for (const forbidden of ["/send_email", "/analytics/track", "/analytics/summary",
    "/analytics/warehouse", "/ask"]) {
    expect(paths).not.toContain(forbidden);
  }
});

test("sends the selected request and renders the formatted response", async () => {
  api.rawGet.mockResolvedValue(json({ name: "Arunangshu Pramanik", repos: 12, open: true }));
  render(<ApiPlayground />);
  fireEvent.click(screen.getByRole("button", { name: /send/i }));
  await waitFor(() => expect(screen.getByText("200")).toBeInTheDocument());
  expect(api.rawGet).toHaveBeenCalledWith("/personal_info", expect.anything());
  expect(api.trackEvent).toHaveBeenCalledWith("api_try", { endpoint: "/personal_info" });
  expect(screen.getByText('"Arunangshu Pramanik"')).toBeInTheDocument();
  expect(screen.getByText("42 ms")).toBeInTheDocument();
});

test("shows error statuses instead of throwing", async () => {
  api.rawGet.mockResolvedValue(json({ detail: "unavailable" }, 503));
  render(<ApiPlayground />);
  fireEvent.click(screen.getByRole("button", { name: /send/i }));
  await waitFor(() => expect(screen.getByText("503")).toBeInTheDocument());
});

test("reports network failures", async () => {
  api.rawGet.mockRejectedValue(new TypeError("Failed to fetch"));
  render(<ApiPlayground />);
  fireEvent.click(screen.getByRole("button", { name: /send/i }));
  await waitFor(() => expect(screen.getByText(/could not be reached/)).toBeInTheDocument());
});

test("validates path parameters before sending", () => {
  render(<ApiPlayground />);
  fireEvent.click(screen.getByRole("button", { name: "/notes/{note_id}" }));
  const send = screen.getByRole("button", { name: /send/i });
  expect(send).toBeDisabled();
  fireEvent.change(screen.getByPlaceholderText(/e\.g\./), { target: { value: "../etc" } });
  expect(screen.getByText(/lowercase letters/)).toBeInTheDocument();
  expect(send).toBeDisabled();
  fireEvent.change(screen.getByPlaceholderText(/e\.g\./), { target: { value: "my-note" } });
  expect(send).not.toBeDisabled();
});

test("hides the terminal card until the npm package exists", async () => {
  render(<ApiPlayground />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.queryByText(/npx arunangshu/)).not.toBeInTheDocument();
});

test("shows the terminal card once the npm package is published", async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  render(<ApiPlayground />);
  expect(await screen.findByText(/npx arunangshu/)).toBeInTheDocument();
});

test("highlightJson renders text, never HTML", () => {
  const { container } = render(<pre>{highlightJson('{"x": "<img src=x onerror=alert(1)>"}')}</pre>);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
});

test("uses the same endpoint list on every device (no device-specific picker)", () => {
  const { container } = render(<ApiPlayground />);
  expect(container.querySelector("select")).toBeNull();
  const list = screen.getByRole("navigation", { name: "API endpoints" });
  expect(list.className).not.toMatch(/(^|\s)(hidden|lg:hidden)(\s|$)/);
  expect(within(list).getAllByRole("button")).toHaveLength(ENDPOINTS.length);
});
