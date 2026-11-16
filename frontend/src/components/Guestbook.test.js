import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Guestbook from "./Guestbook";

jest.mock("../api", () => ({
  ...jest.requireActual("../api"),
  getGuestbook: jest.fn(),
  signGuestbook: jest.fn(),
}));

const api = require("../api");

beforeEach(() => jest.clearAllMocks());

const OLD = { id: "a1", name: "Grace", message: "Hello!", created_at: "2026-11-14T10:00:00Z" };

test("hides the section when the guestbook can't be loaded", async () => {
  api.getGuestbook.mockRejectedValue(new Error("down"));
  const { container } = render(<Guestbook />);
  await waitFor(() => expect(api.getGuestbook).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

test("shows a new entry immediately after signing", async () => {
  api.getGuestbook.mockResolvedValue({ entries: [OLD] });
  api.signGuestbook.mockResolvedValue({
    message: "Thanks",
    entry: { id: "b2", name: "Ada", message: "Lovely work", created_at: "2026-11-15T10:00:00Z" },
  });
  render(<Guestbook />);
  fireEvent.change(await screen.findByLabelText("Your name"), { target: { value: " Ada " } });
  fireEvent.change(screen.getByLabelText("Your message"), { target: { value: "Lovely work" } });
  fireEvent.click(screen.getByRole("button", { name: /sign/i }));
  expect(await screen.findByText('"Lovely work"')).toBeInTheDocument();
  expect(screen.getByText('"Hello!"')).toBeInTheDocument();
  expect(api.signGuestbook).toHaveBeenCalledWith("Ada", "Lovely work", "");
  expect(screen.getByLabelText("Your name")).toHaveValue("");
});

test("surfaces server validation errors", async () => {
  api.getGuestbook.mockResolvedValue({ entries: [] });
  api.signGuestbook.mockRejectedValue(new Error("Links aren't allowed in guestbook entries."));
  render(<Guestbook />);
  expect(await screen.findByText(/be the first to sign/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Bot" } });
  fireEvent.change(screen.getByLabelText("Your message"), { target: { value: "www.spam.com" } });
  fireEvent.click(screen.getByRole("button", { name: /sign/i }));
  expect(await screen.findByText(/Links aren't allowed/)).toBeInTheDocument();
});

test("the honeypot field is hidden from assistive tech and keyboard users", async () => {
  api.getGuestbook.mockResolvedValue({ entries: [] });
  const { container } = render(<Guestbook />);
  await screen.findByLabelText("Your name");
  const honeypot = container.querySelector('input[name="website"]');
  expect(honeypot).toHaveAttribute("aria-hidden", "true");
  expect(honeypot).toHaveAttribute("tabindex", "-1");
});
