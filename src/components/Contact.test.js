import { fireEvent, render, screen } from "@testing-library/react";
import Contact from "./Contact";

const fill = () => {
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Tony" } });
  fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: "tony@stark.com" } });
  fireEvent.change(screen.getByPlaceholderText(/your message/i), { target: { value: "Hi" } });
};

const respond = (status, body) =>
  fetch.mockResolvedValue({ ok: status < 300, status, json: () => Promise.resolve(body) });

beforeEach(() => {
  global.fetch = jest.fn();
});

test("submits, shows the success message and clears the form", async () => {
  respond(201, { message: "Message sent successfully." });
  render(<Contact />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

  expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  expect(await screen.findByText(/Message sent successfully\./)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/your name/i)).toHaveValue("");
  expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
});

test("shows the rate-limit message on 429 and keeps the input", async () => {
  respond(429, { detail: { error_message: "Too many messages sent. Please try again later." } });
  render(<Contact />);
  fill();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

  expect(await screen.findByText(/Too many messages sent/)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/your name/i)).toHaveValue("Tony");
});

test("requires all fields", () => {
  render(<Contact />);
  for (const p of [/your name/i, /your email/i, /your message/i]) {
    expect(screen.getByPlaceholderText(p)).toBeRequired();
  }
});
