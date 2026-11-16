import { render, screen } from "@testing-library/react";
import { SECTIONS, section, sectionMeta } from "./sections";
import Section from "./components/Section";

test("section ids are unique and numbered 01..N in page order", () => {
  const ids = SECTIONS.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  SECTIONS.forEach(({ id }, i) => {
    expect(section(id).num).toBe(String(i + 1).padStart(2, "0"));
  });
});

test("unknown sections fail loudly instead of rendering a wrong number", () => {
  expect(() => section("nope")).toThrow(/sections\.js/);
  expect(sectionMeta("nope")).toBeUndefined();
});

test("Section headings come from the registry", () => {
  const notes = section("notes");
  render(<Section id="notes">{() => <p>body</p>}</Section>);
  expect(screen.getByRole("heading", { name: notes.label })).toBeInTheDocument();
  expect(screen.getByText(`${notes.num} /`)).toBeInTheDocument();
  expect(screen.getByText(notes.eyebrow)).toBeInTheDocument();
});
