import { render, screen } from "@testing-library/react";
import Skills from "./Skills";

const skills = {
  programming_languages: ["Python", "SQL"],
  databases_and_datawarehouses: ["Snowflake"],
  others: {
    devops: ["Docker"],
    ides_and_editors: ["Cursor"],
    some_new_category: ["Brand New Tool"],
  },
};

test("renders named and nested 'others' categories with readable titles", () => {
  render(<Skills state={{ data: skills, loading: false, error: null }} />);
  for (const title of [
    "Programming Languages",
    "Databases and Data Warehouses",
    "DevOps",
    "IDEs and Editors",
    "Some New Category",
  ]) {
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  }
  expect(screen.queryByText(/^Others$/i)).not.toBeInTheDocument();
});

test("renders every skill chip, including unmapped ones", () => {
  render(<Skills state={{ data: skills, loading: false, error: null }} />);
  for (const s of ["Python", "SQL", "Snowflake", "Docker", "Cursor", "Brand New Tool"]) {
    expect(screen.getByText(s)).toBeInTheDocument();
  }
});
