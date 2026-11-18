#!/usr/bin/env node
"use strict";

const { loadData } = require("../lib/data");
const { render } = require("../lib/render");

const HELP = `
Usage: npx arunangshu [options]

Arunangshu Pramanik's resume, in your terminal.

Options:
  --full        Include responsibilities and project highlights
  --offline     Skip the network; use the bundled snapshot
  --json        Print the raw resume data as JSON
  --no-color    Disable colors (also respects NO_COLOR)
  --open        Open the portfolio website in your browser
  -h, --help    Show this help
  -v, --version Show the version
`;

const SITE = "https://arunangshupramanik.com/";

function openSite() {
  const { spawn } = require("node:child_process");
  const [cmd, args] = process.platform === "darwin" ? ["open", [SITE]]
    : process.platform === "win32" ? ["cmd", ["/c", "start", "", SITE]]
    : ["xdg-open", [SITE]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {
    process.stdout.write(`${SITE}\n`);
  }).unref();
}

async function main(argv) {
  const flags = new Set(argv);
  if (flags.has("-h") || flags.has("--help")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (flags.has("-v") || flags.has("--version")) {
    process.stdout.write(`${require("../package.json").version}\n`);
    return 0;
  }
  const unknown = argv.filter((arg) => !["--full", "--offline", "--json", "--no-color", "--open"].includes(arg));
  if (unknown.length) {
    process.stderr.write(`Unknown option: ${unknown[0]}\n${HELP}`);
    return 1;
  }
  if (flags.has("--open")) {
    openSite();
    return 0;
  }

  const { data, source } = await loadData({ offline: flags.has("--offline") });
  if (flags.has("--json")) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return 0;
  }
  const color = Boolean(process.stdout.isTTY) && !flags.has("--no-color") && !process.env.NO_COLOR;
  process.stdout.write(render(data, {
    color,
    full: flags.has("--full"),
    width: process.stdout.columns || 80,
    source,
  }));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (error) => {
    process.stderr.write(`arunangshu: ${error.message}\n`);
    process.exitCode = 1;
  }
);
