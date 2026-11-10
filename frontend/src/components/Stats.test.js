import { render, screen } from "@testing-library/react";
import Stats from "./Stats";

const data = {
  total_views: 142,
  viewing_now: 3,
  daily_views: [
    { date: "2026-11-01", views: 10 },
    { date: "2026-11-02", views: 0 },
    { date: "2026-11-03", views: 25 },
  ],
  events: { page_view: 142, project_click: 9, resume_download: 4 },
  projects: { doppel: { clicks: 5, previews: 2, case_studies: 2 } },
};

test("renders aggregate counters, daily bars, events and project engagement", () => {
  render(<Stats state={{ data, loading: false }} />);
  expect(screen.getByRole("heading", { name: "Stats" })).toBeInTheDocument();
  expect(screen.getAllByText("142").length).toBeGreaterThan(0);
  expect(screen.getByText("Total views")).toBeInTheDocument();
  expect(screen.getByText("Viewing now")).toBeInTheDocument();
  expect(screen.getByText("35")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Daily views/ })).toBeInTheDocument();
  expect(screen.getByText("Project clicks")).toBeInTheDocument();
  expect(screen.getByText("Resume downloads")).toBeInTheDocument();
  expect(screen.getByText("doppel")).toBeInTheDocument();
  expect(screen.getByText(/5 clicks · 2 previews · 2 case studies/)).toBeInTheDocument();
});

test("handles sparse data without rendering empty blocks", () => {
  render(<Stats state={{ data: { total_views: 0, viewing_now: 0, daily_views: [], events: {}, projects: {} }, loading: false }} />);
  expect(screen.queryByRole("img", { name: /Daily views/ })).not.toBeInTheDocument();
  expect(screen.queryByText("Event counts")).not.toBeInTheDocument();
  expect(screen.queryByText("Project engagement")).not.toBeInTheDocument();
});
