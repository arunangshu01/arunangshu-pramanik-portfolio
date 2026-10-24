import { fireEvent, render, screen } from "@testing-library/react";
import Projects from "./Projects";

const project = {
  id: "mahakal", name: "M.A.H.A.K.A.L.", description: "A voice AI assistant.",
  technologies: ["React", "FastAPI"], highlights: ["Streaming replies"],
  live_url: "https://mahakal-ai.web.app/", github_url: "https://github.com/arunangshu01/mahakal",
  image: "/mahakal-preview.png", status: "live", featured: true, preview_enabled: true,
};
const renderProject = (changes = {}) => render(<Projects state={{ data: [{ ...project, ...changes }], loading: false }} />);

test("renders project content, screenshot and safe external links", () => {
  renderProject();
  expect(screen.getByRole("heading", { name: "M.A.H.A.K.A.L." })).toBeInTheDocument();
  expect(screen.getByText("Streaming replies")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Screenshot of/ })).toHaveAttribute("src", "/mahakal-preview.png");
  expect(screen.getByRole("link", { name: /Source code/ })).toHaveAttribute("rel", "noopener noreferrer");
  expect(document.querySelector("iframe")).toBeNull();
});

test("loads a sandboxed demo only on request and unloads on close", () => {
  renderProject();
  fireEvent.click(screen.getByRole("button", { name: /Load live preview/ }));
  const frame = screen.getByTitle("Live preview of M.A.H.A.K.A.L.");
  expect(frame).toHaveAttribute("src", project.live_url);
  expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
  expect(frame).toHaveAttribute("allow", "microphone 'none'; camera 'none'; geolocation 'none'");
  fireEvent.click(screen.getByRole("button", { name: /Close live preview/ }));
  expect(document.querySelector("iframe")).toBeNull();
});

test("supports private projects and image failure without broken actions", () => {
  renderProject({ live_url: null, github_url: null });
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Load live preview/ })).not.toBeInTheDocument();
  fireEvent.error(screen.getByRole("img", { name: /Screenshot of/ }));
  expect(screen.getByText("Project preview")).toBeInTheDocument();
});

test("rejects unsafe links", () => {
  renderProject({ live_url: "javascript:alert(1)", github_url: "data:text/html,anything" });
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Load live preview/ })).not.toBeInTheDocument();
});

test("empty projects and loading states render gracefully", () => {
  const { rerender } = render(<Projects state={{ data: [], loading: false }} />);
  expect(screen.getByText(/More projects coming soon/)).toBeInTheDocument();
  rerender(<Projects state={{ loading: true }} />);
  expect(screen.getByRole("status")).toBeInTheDocument();
});
