import { render, screen } from "@testing-library/react";
import Hero from "./Hero";

const info = {
  name: "Arunangshu Pramanik",
  location: { city: "Bangalore", state: "Karnataka", country: "India" },
  social_media_profiles: {
    linkedin: "https://linkedin.com/in/x",
    github: "https://github.com/x",
    leetcode: "https://leetcode.com/x",
  },
};

test("social links use proper brand casing and open in a new tab", () => {
  render(<Hero info={info} summary="Summary" />);
  for (const [label, url] of [
    ["LinkedIn", info.social_media_profiles.linkedin],
    ["GitHub", info.social_media_profiles.github],
    ["LeetCode", info.social_media_profiles.leetcode],
  ]) {
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
  }
});

test("resume view and download links point at the backend endpoints", () => {
  render(<Hero info={info} summary="Summary" />);
  expect(screen.getByRole("link", { name: /view resume/i })).toHaveAttribute(
    "href",
    "/arunangshu_pramanik/portfolio/v1/resume/view"
  );
  expect(screen.getByRole("link", { name: /download resume/i })).toHaveAttribute(
    "href",
    "/arunangshu_pramanik/portfolio/v1/resume/download"
  );
});

test("renders the name, summary and location", () => {
  render(<Hero info={info} summary="Builds data platforms." />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Arunangshu\s*Pramanik/);
  expect(screen.getByText("Builds data platforms.")).toBeInTheDocument();
  expect(screen.getByText(/Bangalore, Karnataka/)).toBeInTheDocument();
});

test("still renders without API data", () => {
  render(<Hero info={null} summary={undefined} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Arunangshu/);
});
