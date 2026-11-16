import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Navbar from "./Navbar";
import { SECTIONS } from "../sections";

const LABELS = [...SECTIONS.map((s) => s.short ?? s.label), "Resume"];
const BREAKPOINT_DISPLAY = /(^|\s)(hidden|(sm|md|lg|xl|2xl|min-\[\d+px\]):(hidden|flex|block|inline|inline-flex))(\s|$)/;

const renderNav = (name = "Arunangshu Pramanik") =>
  render(<Navbar name={name} light={false} onToggleTheme={jest.fn()} />);

test("one link row lists every section plus the resume, in page order", () => {
  renderNav();
  const row = screen.getByTestId("nav-links");
  expect(within(row).getAllByRole("link").map((a) => a.textContent)).toEqual(LABELS);
  SECTIONS.forEach(({ id, short, label }) => {
    expect(within(row).getByRole("link", { name: short ?? label })).toHaveAttribute("href", `#${id}`);
  });
  expect(within(row).getByRole("link", { name: "Resume" })).toHaveAttribute("target", "_blank");
});

test("nothing in the navbar is shown or hidden per screen size", () => {
  const { container } = renderNav();
  for (const el of container.querySelectorAll("nav *")) {
    const cls = typeof el.className === "string" ? el.className : "";
    expect(cls).not.toMatch(BREAKPOINT_DISPLAY);
  }
  // Every link appears exactly once (no separate desktop/mobile copies).
  for (const label of LABELS.filter((l) => l !== "API")) {
    expect(screen.getAllByRole("link", { name: label })).toHaveLength(1);
  }
});

test("the name is always shown next to the logo", () => {
  renderNav();
  const brand = screen.getByRole("link", { name: /Arunangshu Pramanik - back to top/ });
  expect(brand).toHaveTextContent("Arunangshu");
  expect(brand).toHaveTextContent("Pramanik");
});

test("API Playground shortcut, palette, and theme buttons are in the top bar", () => {
  const listener = jest.fn();
  window.addEventListener("open-palette", listener);
  renderNav();
  expect(screen.getByRole("link", { name: "API Playground" })).toHaveAttribute("href", "#api");
  fireEvent.click(screen.getByRole("button", { name: "Open command palette" }));
  expect(listener).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  window.removeEventListener("open-palette", listener);
});

test("highlights the section in view", () => {
  const observers = [];
  const original = global.IntersectionObserver;
  global.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  };
  const el = document.createElement("section");
  el.id = "notes";
  document.body.appendChild(el);
  try {
    renderNav();
    act(() => {
      observers[0].callback([{ target: el, isIntersecting: true, boundingClientRect: { top: 10 } }]);
    });
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute("aria-current");
  } finally {
    el.remove();
    global.IntersectionObserver = original;
  }
});
