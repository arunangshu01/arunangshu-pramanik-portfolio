import { RESUME_VIEW_URL } from "./api";

// Single source of truth for page sections, in page order. The navbar, command
// palette, and section headings ("07 / field notes") all derive from this list,
// so numbering and navigation can never drift apart.
export const SECTIONS = [
  { id: "about", label: "About", eyebrow: "the engineer behind the suit" },
  { id: "skills", label: "Skills", eyebrow: "what i work with" },
  { id: "projects", label: "Projects", eyebrow: "what i've built" },
  { id: "experience", label: "Experience", eyebrow: "where i've been" },
  { id: "education", label: "Education", eyebrow: "background" },
  { id: "awards", label: "Awards", eyebrow: "recognition" },
  { id: "notes", label: "Notes", eyebrow: "field notes" },
  { id: "contact", label: "Contact", eyebrow: "let's talk" },
  { id: "stats", label: "Stats", eyebrow: "transparency" },
  { id: "guestbook", label: "Guestbook", eyebrow: "say hi" },
  { id: "api", label: "API Playground", short: "API", eyebrow: "try the backend" },
];

const BY_ID = Object.fromEntries(SECTIONS.map((s, i) => [s.id, { ...s, num: String(i + 1).padStart(2, "0") }]));

export const section = (id) => {
  const found = BY_ID[id];
  if (!found) throw new Error(`Unknown section "${id}" - add it to src/sections.js`);
  return found;
};

export const sectionMeta = (id) => BY_ID[id];

export const RESUME_LINK = { label: "Resume", href: RESUME_VIEW_URL, external: true };
