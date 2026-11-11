import { fireEvent, render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

test("command palette button is available at every screen size", () => {
  const listener = jest.fn();
  window.addEventListener("open-palette", listener);
  render(<Navbar name="Arunangshu Pramanik" light={false} onToggleTheme={jest.fn()} />);
  const button = screen.getByRole("button", { name: "Open command palette" });
  expect(button.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  fireEvent.click(button);
  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener("open-palette", listener);
});
