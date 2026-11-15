"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { render, wrapText, visibleLength, clean } = require("../lib/render");
const { loadData, loadSnapshot } = require("../lib/data");

const snapshot = loadSnapshot();

test("snapshot has every section the renderer uses", () => {
  for (const key of ["info", "summary", "experience", "skills", "projects", "education"]) {
    assert.ok(snapshot[key], `missing ${key}`);
  }
  assert.ok(Array.isArray(snapshot.experience) && snapshot.experience.length > 0);
  assert.ok(Array.isArray(snapshot.projects) && snapshot.projects.length > 0);
});

test("renders the key resume sections without color", () => {
  const out = render(snapshot, { color: false, width: 80 });
  assert.match(out, /Arunangshu Pramanik/);
  for (const section of ["ABOUT", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"]) {
    assert.match(out, new RegExp(section));
  }
  assert.doesNotMatch(out, /\x1b\[/, "no ANSI codes when color is off");
});

test("no line exceeds the requested width", () => {
  for (const width of [48, 60, 80, 100]) {
    const out = render(snapshot, { color: true, width, full: true });
    for (const line of out.split("\n")) {
      assert.ok(visibleLength(line) <= width, `width ${width}: "${line}"`);
    }
  }
});

test("--full adds responsibilities", () => {
  const short = render(snapshot, { color: false });
  const full = render(snapshot, { color: false, full: true });
  assert.ok(full.length > short.length);
});

test("strips terminal escape sequences from remote data", () => {
  const hostile = { ...snapshot, info: { ...snapshot.info, name: "Evil\x1b]0;pwned\x07\x1b[2J" } };
  const out = render(hostile, { color: false });
  assert.doesNotMatch(out, /\x1b/);
  assert.doesNotMatch(out, /\x07/);
  assert.equal(clean("a\x1bb\x00c"), "abc");
});

test("tolerates missing or malformed sections", () => {
  const out = render({ info: {}, experience: null, projects: "nope", skills: {} }, { color: false });
  assert.match(out, /Arunangshu Pramanik/);
});

test("wrapText respects width", () => {
  const lines = wrapText("one two three four five six seven", 10);
  assert.ok(lines.every((line) => line.length <= 10));
  assert.equal(lines.join(" "), "one two three four five six seven");
});

test("falls back to the snapshot when the API is unreachable", async () => {
  const { data, source } = await loadData({ api: "http://127.0.0.1:9", timeoutMs: 500 });
  assert.equal(source, "snapshot");
  assert.deepEqual(data.info, snapshot.info);
});

test("CLI prints no ANSI codes when stdout is not a TTY", () => {
  const { execFileSync } = require("node:child_process");
  const path = require("node:path");
  const out = execFileSync(process.execPath,
    [path.join(__dirname, "..", "bin", "arunangshu.js"), "--offline"], { encoding: "utf8" });
  assert.match(out, /Arunangshu Pramanik/);
  assert.doesNotMatch(out, /\x1b\[/);
});

test("CLI rejects unknown options with exit code 1", () => {
  const { spawnSync } = require("node:child_process");
  const path = require("node:path");
  const result = spawnSync(process.execPath,
    [path.join(__dirname, "..", "bin", "arunangshu.js"), "--bogus"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);
});

test("offline mode never touches the network", async () => {
  const { source } = await loadData({ offline: true, api: "http://invalid.invalid" });
  assert.equal(source, "snapshot");
});
