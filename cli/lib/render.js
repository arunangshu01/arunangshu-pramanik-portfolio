"use strict";

const ANSI = /\x1b\[[0-9;]*m/g;
// Remote data must never smuggle terminal escape sequences into the output.
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

const visibleLength = (s) => [...s.replace(ANSI, "")].length;
const clean = (value) => String(value ?? "").replace(CONTROL, "").trim();

function palette(color) {
  const wrap = (open) => (s) => (color ? `\x1b[${open}m${s}\x1b[0m` : s);
  return {
    bold: wrap("1"),
    dim: wrap("2"),
    accent: wrap("38;5;214"),
    red: wrap("38;5;160"),
    cyan: wrap("38;5;80"),
    gray: wrap("38;5;245"),
    underline: wrap("4"),
  };
}

function wrapText(text, width) {
  const lines = [];
  let line = "";
  const words = clean(text).split(/\s+/).filter(Boolean).flatMap((word) => {
    const chars = [...word];
    if (chars.length <= width) return [word];
    const parts = [];
    for (let i = 0; i < chars.length; i += width) parts.push(chars.slice(i, i + width).join(""));
    return parts;
  });
  for (const word of words) {
    if (!line) line = word;
    else if (visibleLength(line) + 1 + visibleLength(word) <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const displayUrl = (url) => clean(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function truncate(s, max) {
  if (visibleLength(s) <= max) return s;
  return `${[...s.replace(ANSI, "")].slice(0, Math.max(0, max - 1)).join("")}…`;
}

// Label/value rows that don't fit side by side put the value on its own line.
function rows(pairs, inner, c) {
  const labelWidth = 9;
  return pairs.flatMap(([label, value]) =>
    labelWidth + 1 + visibleLength(value) <= inner
      ? [`${c.gray(label.padEnd(labelWidth))} ${c.cyan(value)}`]
      : [c.gray(label), `  ${c.cyan(truncate(value, inner - 2))}`]
  );
}

function box(lines, width, c) {
  const inner = width - 4;
  const pad = (s) => {
    const fitted = visibleLength(s) > inner ? truncate(s, inner) : s;
    return fitted + " ".repeat(Math.max(0, inner - visibleLength(fitted)));
  };
  return [
    c.accent(`╭${"─".repeat(width - 2)}╮`),
    ...lines.map((s) => `${c.accent("│")} ${pad(s)} ${c.accent("│")}`),
    c.accent(`╰${"─".repeat(width - 2)}╯`),
  ].join("\n");
}

const heading = (title, c) => `\n${c.accent("▍")}${c.bold(title.toUpperCase())}`;
const bullet = (text, width, c, indent = "  ") =>
  wrapText(text, width - indent.length - 2)
    .map((line, i) => `${indent}${i === 0 ? c.accent("•") : " "} ${line}`)
    .join("\n");

function titleCase(key) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function render(data, { color = true, width = 80, full = false, source = "live" } = {}) {
  const c = palette(color);
  width = Math.max(48, Math.min(width, 100));
  const info = data.info ?? {};
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const skills = data.skills ?? {};
  const education = data.education ?? {};
  const socials = info.social_media_profiles ?? {};
  const location = info.location ?? {};
  const out = [];

  const card = [
    c.bold(c.accent(clean(info.name) || "Arunangshu Pramanik")),
    clean(experience[0]?.role) || "Software Engineer",
    c.gray([location.city, location.country].map(clean).filter(Boolean).join(", ")),
    "",
    ...rows([
      ...(info.email ? [["email", clean(info.email)]] : []),
      ["web", "arunangshu-pramanik-portfolio.web.app"],
      ...Object.entries(socials).map(([name, url]) => [clean(name), displayUrl(url)]),
    ], width - 4, c),
  ];
  out.push(box(card, width, c));

  if (data.summary?.summary) {
    out.push(heading("About", c));
    out.push(wrapText(data.summary.summary, width - 2).map((l) => `  ${l}`).join("\n"));
  }

  if (experience.length) {
    out.push(heading("Experience", c));
    for (const job of full ? experience : experience.slice(0, 4)) {
      const role = clean(job.role);
      const company = clean(job.company);
      if (visibleLength(`${role} @ ${company}`) <= width - 2) {
        out.push(`  ${c.bold(role)} ${c.gray("@")} ${c.accent(company)}`);
      } else {
        out.push(wrapText(role, width - 2).map((l) => `  ${c.bold(l)}`).join("\n"));
        out.push(wrapText(company, width - 4).map((l, i) => `  ${i ? "  " : c.gray("@ ")}${c.accent(l)}`).join("\n"));
      }
      out.push(`  ${c.gray(clean(job.duration))}`);
      if (full) {
        for (const item of job.responsibilities ?? []) out.push(bullet(item, width, c));
      }
    }
    if (!full && experience.length > 4) {
      out.push(c.dim(`  … ${experience.length - 4} earlier role(s) — run with --full`));
    }
  }

  if (projects.length) {
    out.push(heading("Projects", c));
    for (const project of projects) {
      const status = project.status ? `  [${clean(project.status)}]` : "";
      out.push(`  ${c.bold(truncate(clean(project.name), width - 2 - status.length))}${c.gray(status)}`);
      const description = clean(project.description);
      const lines = wrapText(description, width - 4);
      const shown = full || lines.length <= 2 ? lines
        : [lines[0], truncate(`${lines[1]} …`, width - 4)];
      out.push(shown.map((l) => `    ${l}`).join("\n"));
      if (project.live_url || project.github_url) {
        out.push(`    ${c.cyan(truncate(clean(project.live_url || project.github_url), width - 4))}`);
      }
      if (full) {
        for (const item of project.highlights ?? []) out.push(bullet(item, width, c, "    "));
      }
    }
  }

  const skillRows = Object.entries(skills).filter(([, value]) => Array.isArray(value) && value.length);
  if (skillRows.length) {
    out.push(heading("Skills", c));
    const labelWidth = Math.max(...skillRows.map(([key]) => titleCase(key).length));
    for (const [key, values] of skillRows) {
      const label = titleCase(key).padEnd(labelWidth);
      const lines = wrapText(values.map(clean).join(", "), width - labelWidth - 5);
      out.push(lines.map((l, i) => `  ${i === 0 ? c.gray(label) : " ".repeat(labelWidth)} ${l}`).join("\n"));
    }
  }

  if (education.degree) {
    out.push(heading("Education", c));
    out.push(wrapText(education.degree, width - 2).map((l) => `  ${c.bold(l)}`).join("\n"));
    const institution = `${clean(education.institution)} · ${clean(education.duration)}`;
    out.push(wrapText(institution, width - 2).map((l) => `  ${c.gray(l)}`).join("\n"));
  }

  const note = source === "live" ? "live from the portfolio API" : source === "partial"
    ? "partly live · some sections from the bundled snapshot" : "offline snapshot";
  out.push("");
  out.push(wrapText(`${note} · --full for details · --help for options`, width - 2)
    .map((l) => c.dim(`  ${l}`)).join("\n"));
  return `${out.join("\n")}\n`;
}

module.exports = { render, wrapText, visibleLength, clean };
