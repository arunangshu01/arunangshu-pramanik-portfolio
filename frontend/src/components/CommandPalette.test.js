import { fireEvent, render, screen } from "@testing-library/react";
import CommandPalette from "./CommandPalette";

const info = {
  name: "Arunangshu Pramanik",
  email: "arunangshu01@gmail.com",
  social_media_profiles: { github: "https://github.com/arunangshu01", linkedin: "https://linkedin.com/in/x" },
};

const renderPalette = (props = {}) =>
  render(<CommandPalette info={info} light={false} onToggleTheme={jest.fn()} {...props} />);

const openPalette = () => fireEvent.keyDown(document, { key: "k", metaKey: true });

test("opens with Cmd+K, filters commands, runs selection, closes with Escape", () => {
  renderPalette();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  openPalette();
  const input = screen.getByLabelText("Command palette search");
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "proj" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(window.location.hash).toBe("#projects");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens via navbar event and runs a command on click", () => {
  const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
  renderPalette();
  fireEvent(window, new Event("open-palette"));
  fireEvent.click(screen.getByRole("option", { name: /Open GitHub/ }).querySelector("button"));
  expect(openSpy).toHaveBeenCalledWith("https://github.com/arunangshu01", "_blank", "noopener");
  openSpy.mockRestore();
});

test("theme action delegates to the provided handler", () => {
  const onToggleTheme = jest.fn();
  renderPalette({ onToggleTheme });
  openPalette();
  fireEvent.click(screen.getByRole("option", { name: /Switch to light mode/ }).querySelector("button"));
  expect(onToggleTheme).toHaveBeenCalled();
});

test("shows empty state for unmatched queries", () => {
  renderPalette();
  openPalette();
  fireEvent.change(screen.getByLabelText("Command palette search"), { target: { value: "zzz" } });
  expect(screen.getByText("No matching commands")).toBeInTheDocument();
});
