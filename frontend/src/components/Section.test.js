import { render, screen } from "@testing-library/react";
import Section from "./Section";

const renderSection = (state) =>
  render(
    <Section id="x" num="01" eyebrow="eyebrow" title="Title" state={state}>
      {(data) => <p>{data}</p>}
    </Section>
  );

test("shows a plain loading state at first", () => {
  renderSection({ loading: true, slow: false });
  expect(screen.getByRole("status")).toHaveTextContent("Loading…");
});

test("explains the cold start when loading is slow", () => {
  renderSection({ loading: true, slow: true });
  expect(screen.getByRole("status")).toHaveTextContent(/bringing systems online/i);
});

test("shows a fallback on error", () => {
  renderSection({ loading: false, error: new Error("x") });
  expect(screen.getByText("// content unavailable")).toBeInTheDocument();
});

test("renders static children when no API state is given", () => {
  render(
    <Section id="s" title="Static">
      {() => <p>static content</p>}
    </Section>
  );
  expect(screen.getByText("static content")).toBeInTheDocument();
});

test("renders children with data", () => {
  renderSection({ loading: false, data: "payload" });
  expect(screen.getByText("payload")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
});
