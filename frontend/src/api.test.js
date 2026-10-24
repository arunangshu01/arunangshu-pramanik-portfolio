const BASE = "/arunangshu_pramanik/portfolio/v1";

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

let api;
beforeEach(() => {
  jest.resetModules();
  delete process.env.REACT_APP_ENABLE_ANALYTICS;
  global.fetch = jest.fn();
  api = require("./api");
});

describe("GET endpoints", () => {
  test("returns parsed JSON from the right path", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { summary: "hi" }));
    await expect(api.getProfileSummary()).resolves.toEqual({ summary: "hi" });
    expect(fetch).toHaveBeenCalledWith(`${BASE}/profile_summary`);
  });

  test.each([
    ["getPersonalInfo", "/personal_info"],
    ["getEducationDetails", "/education_details"],
    ["getSkills", "/skills"],
    ["getExperience", "/experience"],
    ["getAwards", "/awards_recognitions"],
    ["getProjects", "/projects"],
  ])("%s hits %s", async (fn, path) => {
    fetch.mockResolvedValue(jsonResponse(200, {}));
    await api[fn]();
    expect(fetch).toHaveBeenCalledWith(`${BASE}${path}`);
  });

  test("surfaces the backend error_message and status", async () => {
    fetch.mockResolvedValue(
      jsonResponse(422, { detail: { error_message: "Data invalid", error_type: "ValidationError" } })
    );
    await expect(api.getSkills()).rejects.toMatchObject({ message: "Data invalid", status: 422 });
  });

  test("falls back to a generic message when the body is not JSON", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: () => Promise.reject(new Error("html")) });
    await expect(api.getSkills()).rejects.toMatchObject({
      message: "GET /skills failed: 503",
      status: 503,
    });
  });
});

describe("sendContactEmail", () => {
  const form = { name: "Tony", email: "tony@stark.com", message: "Hello" };

  test("posts multipart FormData with name/email/message only", async () => {
    fetch.mockResolvedValue(jsonResponse(201, { message: "Message sent." }));
    await expect(api.sendContactEmail(form)).resolves.toEqual({ message: "Message sent." });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/send_email`);
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(Object.fromEntries(opts.body.entries())).toEqual(form);
    expect(opts.headers).toBeUndefined();
  });

  test("joins FastAPI 422 validation messages", async () => {
    fetch.mockResolvedValue(
      jsonResponse(422, { detail: [{ msg: "Field required" }, { msg: "Invalid email" }] })
    );
    await expect(api.sendContactEmail(form)).rejects.toThrow("Field required, Invalid email");
  });

  test("uses the backend message on 429", async () => {
    fetch.mockResolvedValue(
      jsonResponse(429, { detail: { error_message: "Slow down.", error_type: "RateLimitExceeded" } })
    );
    await expect(api.sendContactEmail(form)).rejects.toThrow("Slow down.");
  });

  test("has a friendly fallback on 429 without a body", async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, json: () => Promise.reject(new Error()) });
    await expect(api.sendContactEmail(form)).rejects.toThrow(/try again later/i);
  });

  test("uses the backend message on 500", async () => {
    fetch.mockResolvedValue(
      jsonResponse(500, { detail: { error_message: "Brevo rejected", error_type: "ApiException" } })
    );
    await expect(api.sendContactEmail(form)).rejects.toThrow("Brevo rejected");
  });
});

describe("public view statistics", () => {
  test("reads counts without incrementing or using an admin token", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { total_views: 9, viewing_now: 1 }));
    const signal = new AbortController().signal;
    await expect(api.getViewStats(signal)).resolves.toEqual({ total_views: 9, viewing_now: 1 });
    expect(fetch).toHaveBeenCalledWith(`${BASE}/analytics/views`, { cache: "no-store", signal });
  });

  test("posts only anonymous IDs and forwards cancellation", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { total_views: 1, viewing_now: 1 }));
    const signal = new AbortController().signal;
    await api.updateViewPresence("view-id", "session-id", signal);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/analytics/views`, {
      cache: "no-store", method: "POST", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ view_id: "view-id", session_id: "session-id" }),
    });
  });

  test("preserves rate-limit errors for polling backoff", async () => {
    fetch.mockResolvedValue(jsonResponse(429, {}));
    await expect(api.getViewStats()).rejects.toMatchObject({ status: 429 });
  });
});


describe("helpers", () => {
  test("awardPeriods normalizes string and array", () => {
    expect(api.awardPeriods({ timeline_period: "March 2020" })).toEqual(["March 2020"]);
    expect(api.awardPeriods({ timeline_period: ["Q1", "Q2"] })).toEqual(["Q1", "Q2"]);
  });

  test("resume URLs are built from the API base", () => {
    expect(api.RESUME_VIEW_URL).toBe(`${BASE}/resume/view`);
    expect(api.RESUME_DOWNLOAD_URL).toBe(`${BASE}/resume/download`);
  });
});

describe("analytics", () => {
  test("is disabled outside production by default", () => {
    api.trackEvent("page_view");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("sends a JSON event when enabled and dedupes trackOnce", () => {
    process.env.REACT_APP_ENABLE_ANALYTICS = "true";
    jest.resetModules();
    api = require("./api");
    fetch.mockResolvedValue(jsonResponse(201, {}));

    api.trackEvent("social_click", { platform: "github" });
    api.trackOnce("section_view", "skills", { section: "skills" });
    api.trackOnce("section_view", "skills", { section: "skills" });

    expect(fetch).toHaveBeenCalledTimes(2);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/analytics/track`);
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({
      event: "social_click",
      page: "/",
      metadata: { platform: "github" },
    });
  });

  test("never throws when the request fails", async () => {
    process.env.REACT_APP_ENABLE_ANALYTICS = "true";
    jest.resetModules();
    api = require("./api");
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(() => api.trackEvent("page_view")).not.toThrow();
    await Promise.resolve();
  });
});
