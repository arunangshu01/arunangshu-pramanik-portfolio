import { render, screen } from "@testing-library/react";
import About, { aboutStats, countSkills, parseStart, yearsOfExperience } from "./About";

const experience = [
  { role: "Senior Software Engineer", company: "Impact Analytics", duration: "December 2024 - Present" },
  { role: "Lead Engineer", company: "Apisero", duration: "August 2021 - December 2024" },
  { role: "Systems Engineer", company: "Infosys", duration: "October 2019 - July 2021" },
];
const skills = {
  programming_languages: ["Python", "SQL"],
  frameworks: ["FastAPI"],
  others: { devops: ["Docker", "Python"] },
};

describe("parseStart", () => {
  test("parses 'Month YYYY' without relying on Date string parsing", () => {
    expect(parseStart("October 2019 - July 2021")).toEqual(new Date(2019, 9));
    expect(parseStart("December 2024 - Present")).toEqual(new Date(2024, 11));
  });

  test("returns null for unparseable input", () => {
    expect(parseStart("")).toBeNull();
    expect(parseStart(undefined)).toBeNull();
    expect(parseStart("Sometime - Present")).toBeNull();
  });
});

test("yearsOfExperience counts from the earliest start date", () => {
  expect(yearsOfExperience(experience, new Date(2026, 9, 21))).toBe(7);
  expect(yearsOfExperience(experience, new Date(2026, 8, 1))).toBe(6);
  expect(yearsOfExperience([], new Date())).toBeNull();
  expect(yearsOfExperience(undefined)).toBeNull();
});

test("countSkills dedupes across named and nested categories", () => {
  expect(countSkills(skills)).toBe(4);
  expect(countSkills(null)).toBeNull();
});

test("aboutStats yields placeholders while data is loading", () => {
  expect(aboutStats({}).map(([, v]) => v)).toEqual([null, null, null, null]);
});

test("renders stats and the spec sheet from API data", () => {
  render(
    <About
      info={{ name: "Arunangshu Pramanik", location: { city: "Bangalore", country: "India" } }}
      experience={experience}
      awards={[{}, {}, {}]}
      skills={skills}
      education={{ degree: "B.Tech CSE", institution: "IEM Kolkata" }}
    />
  );
  expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
  expect(screen.getByText("Senior Software Engineer @ Impact Analytics")).toBeInTheDocument();
  expect(screen.getByText("Bangalore, India")).toBeInTheDocument();
  expect(screen.getByText("B.Tech CSE, IEM Kolkata")).toBeInTheDocument();
  expect(screen.getByText("Companies").previousSibling).toHaveTextContent("3");
  expect(screen.getByText("Awards").previousSibling).toHaveTextContent("3");
  expect(screen.getByText("Technologies").previousSibling).toHaveTextContent("4");
  expect(screen.getByRole("img")).toHaveAttribute("src", "/about.jpg");
});

test("renders placeholders without data", () => {
  render(<About />);
  expect(screen.getAllByText("--")).toHaveLength(4);
  expect(screen.queryByText(/Role/i)).not.toBeInTheDocument();
});
