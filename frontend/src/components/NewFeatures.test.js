import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Hero from "./Hero";
import Experience from "./Experience";
import CodingActivity from "./CodingActivity";
import AskBot from "./AskBot";
import Projects from "./Projects";

jest.mock("../api", () => ({
  ...jest.requireActual("../api"),
  getGithubActivity: jest.fn(),
  getLeetcodeStats: jest.fn(),
  getAskStatus: jest.fn(),
  askQuestion: jest.fn(),
  trackEvent: jest.fn(),
  RESUME_VIEW_URL: "/api/resume/view",
  RESUME_DOWNLOAD_URL: "/api/resume/download",
}));

const api = require("../api");

const INFO = {
  name: "Arunangshu Pramanik",
  location: { city: "Bangalore", state: "Karnataka", country: "India" },
};

beforeEach(() => jest.clearAllMocks());

test("hero shows the current project's now-status", () => {
  const projects = [
    { id: "a", name: "Old Project", current: false },
    { id: "flowbench", name: "Flowbench - data pipeline playground", current: true },
  ];
  render(<Hero info={INFO} summary="s" projects={projects} />);
  expect(screen.getByText("Flowbench - data pipeline playground")).toBeInTheDocument();
  expect(screen.getByText(/now/)).toBeInTheDocument();
});

test("hero shows the first current project, Ask the Multiverse, ahead of Flowbench", () => {
  const projects = [
    { id: "ask-the-multiverse", name: "Ask the Multiverse - cited Marvel multiverse Q&A", current: true },
    { id: "mahakal", name: "M.A.H.A.K.A.L.", current: false },
    { id: "flowbench", name: "Flowbench - data pipeline playground", current: true },
  ];
  render(<Hero info={INFO} summary="s" projects={projects} />);
  expect(screen.getByText("Ask the Multiverse - cited Marvel multiverse Q&A")).toBeInTheDocument();
  expect(screen.queryByText("Flowbench - data pipeline playground")).not.toBeInTheDocument();
});

test("ask the multiverse project card renders its live and GitHub links", () => {
  const project = {
    id: "ask-the-multiverse", name: "Ask the Multiverse - cited Marvel multiverse Q&A",
    description: "An unofficial, fan-made explorer. Fan-made project. Not affiliated with or endorsed by Marvel or Disney.",
    technologies: ["Python", "FastAPI", "DuckDB"], highlights: ["Grounded answers."],
    live_url: "https://multiverse.arunangshupramanik.com/", github_url: "https://github.com/arunangshu01/ask-the-multiverse",
    image: "/ask-the-multiverse-preview.png", status: "live", featured: true, current: true, preview_enabled: true,
  };
  render(<Projects state={{ data: [project], loading: false }} />);
  expect(screen.getByRole("heading", { name: project.name })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open live app/ })).toHaveAttribute("href", project.live_url);
  expect(screen.getByRole("link", { name: /Source code/ })).toHaveAttribute("href", project.github_url);
  expect(screen.getByRole("img", { name: /Screenshot of Ask the Multiverse/ })).toHaveAttribute("src", project.image);
  expect(screen.getByText(/Not affiliated with or endorsed by Marvel or Disney/)).toBeInTheDocument();
});

test("hero hides the now-strip when no project is current", () => {
  render(<Hero info={INFO} summary="s" projects={[]} />);
  expect(screen.queryByText(/now \/\//)).not.toBeInTheDocument();
});

test("experience expands collapsed responsibilities", () => {
  const first = {
    role: "Engineer", company: "Acme", location: "Here", duration: "2020 - Now",
    clients_or_customers: "Clients", responsibilities: ["a1", "a2"],
  };
  const job = {
    role: "Engineer", company: "Beta", location: "Somewhere", duration: "2019 - 2020",
    clients_or_customers: "Clients", responsibilities: ["one", "two", "three", "four"],
  };
  render(<Experience state={{ status: "success", data: [first, job] }} />);
  expect(screen.queryByText("three")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /show 2 more/i }));
  expect(screen.getByText("three")).toBeInTheDocument();
  expect(screen.getByText("four")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /show less/i }));
  expect(screen.queryByText("three")).not.toBeInTheDocument();
});

test("coding activity renders github and leetcode cards", async () => {
  api.getGithubActivity.mockResolvedValue({
    public_repos: 12, followers: 4, recent_pushes: 7,
    profile_url: "https://github.com/arunangshu01",
  });
  api.getLeetcodeStats.mockResolvedValue({
    solved: 150, easy: 50, medium: 70, hard: 30, ranking: 1000,
    profile_url: "https://leetcode.com/u/arunangshu01/",
  });
  render(<CodingActivity />);
  await waitFor(() => {
    expect(screen.getByText("On GitHub")).toBeInTheDocument();
    expect(screen.getByText("On LeetCode")).toBeInTheDocument();
  });
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("150")).toBeInTheDocument();
});

test("coding activity renders nothing when both endpoints fail", async () => {
  api.getGithubActivity.mockRejectedValue(new Error("down"));
  api.getLeetcodeStats.mockRejectedValue(new Error("down"));
  const { container } = render(<CodingActivity />);
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test("ask bot stays hidden when the assistant is disabled", async () => {
  api.getAskStatus.mockResolvedValue({ enabled: false });
  render(<AskBot />);
  await waitFor(() => expect(api.getAskStatus).toHaveBeenCalled());
  expect(screen.queryByRole("button", { name: /ask me anything/i })).not.toBeInTheDocument();
});

test("ask bot renders safe readable links and sends project follow-ups", async () => {
  api.getAskStatus.mockResolvedValue({ enabled: true });
  api.askQuestion.mockResolvedValue({ answer: "**Flowbench** uses *SQL* and `DuckDB`.\n1. [Demo](https://flowbench-app.web.app)\n2. https://github.com/arunangshu01/flowbench.\n" + "longword".repeat(50) });
  render(<AskBot />);
  fireEvent.click(await screen.findByRole("button", { name: /ask me anything/i }));
  fireEvent.change(screen.getByLabelText("Question"), { target: { value: "projects?" } });
  fireEvent.click(screen.getByRole("button", { name: /send question/i }));
  expect(await screen.findByRole("link", { name: "Demo" })).toHaveAttribute("href", "https://flowbench-app.web.app");
  const github = screen.getByRole("link", { name: "GitHub repository" });
  expect(github).toHaveAttribute("href", "https://github.com/arunangshu01/flowbench");
  expect(github).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("SQL").tagName).toBe("EM");
  expect(screen.getByText("DuckDB").tagName).toBe("CODE");
  expect(screen.getByText("longword".repeat(50)).closest(".break-words")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tell me more about Flowbench" }));
  expect(api.askQuestion).toHaveBeenLastCalledWith("Tell me more about Flowbench");
  await waitFor(() => expect(screen.queryByLabelText("Assistant is thinking")).not.toBeInTheDocument());
});

test("ask bot offers an Ask the Multiverse follow-up", async () => {
  api.getAskStatus.mockResolvedValue({ enabled: true });
  api.askQuestion.mockResolvedValue({ answer: "His newest project is **Ask the Multiverse**, alongside Flowbench." });
  render(<AskBot />);
  fireEvent.click(await screen.findByRole("button", { name: /ask me anything/i }));
  fireEvent.change(screen.getByLabelText("Question"), { target: { value: "newest project?" } });
  fireEvent.click(screen.getByRole("button", { name: /send question/i }));
  const followUp = await screen.findByRole("button", { name: "Tell me more about Ask the Multiverse" });
  expect(screen.getByRole("button", { name: "Tell me more about Flowbench" })).toBeInTheDocument();
  fireEvent.click(followUp);
  expect(api.askQuestion).toHaveBeenLastCalledWith("Tell me more about Ask the Multiverse");
  await waitFor(() => expect(screen.queryByLabelText("Assistant is thinking")).not.toBeInTheDocument());
});

test("ask bot renders markdown-bold instead of raw asterisks", async () => {
  api.getAskStatus.mockResolvedValue({ enabled: true });
  api.askQuestion.mockResolvedValue({ answer: "He built **flowbench**.\n- pipelines\n- validation" });
  render(<AskBot />);
  fireEvent.click(await screen.findByRole("button", { name: /ask me anything/i }));
  fireEvent.change(screen.getByLabelText("Question"), { target: { value: "projects?" } });
  fireEvent.click(screen.getByRole("button", { name: /send question/i }));
  const bold = await screen.findByText("flowbench");
  expect(bold.tagName).toBe("STRONG");
  expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
});

test("ask bot answers a question when enabled", async () => {
  api.getAskStatus.mockResolvedValue({ enabled: true });
  api.askQuestion.mockResolvedValue({ answer: "He is a senior software engineer." });
  render(<AskBot />);
  fireEvent.click(await screen.findByRole("button", { name: /ask me anything/i }));
  fireEvent.change(screen.getByLabelText("Question"), { target: { value: "what does he do?" } });
  fireEvent.click(screen.getByRole("button", { name: /send question/i }));
  expect(await screen.findByText("He is a senior software engineer.")).toBeInTheDocument();
});
