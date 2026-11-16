"use strict";

// Regenerates data/snapshot.json from backend/information/*.json so the CLI
// works offline. The output mirrors the API response shapes. Runs on publish.
const fs = require("node:fs");
const path = require("node:path");

const info = path.join(__dirname, "..", "..", "backend", "information");
const read = (name) => JSON.parse(fs.readFileSync(path.join(info, name), "utf8"));

const snapshot = {
  info: read("personal_info.json"),
  summary: read("profile_summary.json"),
  experience: read("experience.json").experience,
  skills: read("skills.json").skills,
  projects: read("projects.json"),
  education: read("education_details.json").education,
};

const out = path.join(__dirname, "..", "data", "snapshot.json");
fs.writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
