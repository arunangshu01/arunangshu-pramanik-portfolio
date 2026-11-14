import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import { useApi } from "./useApi";
import {
  getPersonalInfo,
  getProfileSummary,
  getSkills,
  getExperience,
  getEducationDetails,
  getAwards,
  getProjects,
  getDashboard,
  trackEvent,
  trackOnce,
} from "./api";
import BootSequence from "./components/BootSequence";
import CommandPalette from "./components/CommandPalette";
import MusicToggle from "./components/MusicToggle";
import AskBot from "./components/AskBot";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import CodingActivity from "./components/CodingActivity";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Awards from "./components/Awards";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Projects from "./components/Projects";
import Stats from "./components/Stats";

// Skills carries ~80 KB of brand icons; split it out of the critical bundle.
const Skills = lazy(() => import("./components/Skills"));

function App() {
  const info = useApi(getPersonalInfo);
  const summary = useApi(getProfileSummary);
  const skills = useApi(getSkills);
  const experience = useApi(getExperience);
  const education = useApi(getEducationDetails);
  const awards = useApi(getAwards);
  const projects = useApi(getProjects);
  const dashboard = useApi(getDashboard);
  const projectNames = useMemo(
    () => Object.fromEntries((projects.data ?? []).map((project) => [project.id, project.name])),
    [projects.data]
  );
  const [light, setLight] = useState(
    () => localStorage.getItem("theme") === "light"
  );

  useEffect(() => {
    trackOnce("page_view", "home", {
      referrer: (document.referrer || "direct").slice(0, 256),
      viewport: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("theme", light ? "light" : "dark");
  }, [light]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent2/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-red-700/10 blur-[100px]" />
      </div>

      <BootSequence />
      <CommandPalette info={info.data} light={light} onToggleTheme={() => {
          trackEvent("theme_toggle", { theme: light ? "dark" : "light", source: "palette" });
          setLight((v) => !v);
        }} />
      <MusicToggle />
      <Navbar name={info.data?.name} light={light} onToggleTheme={() => {
          trackEvent("theme_toggle", { theme: light ? "dark" : "light" });
          setLight((v) => !v);
        }} />
      <AskBot />
      <Hero info={info.data} summary={summary.data?.summary} projects={projects.data} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <About
          info={info.data}
          experience={experience.data}
          awards={awards.data}
          skills={skills.data}
          education={education.data}
        />
        <CodingActivity />
        <Suspense fallback={<section id="skills" className="min-h-[60vh]" />}>
          <Skills state={skills} />
        </Suspense>
        <Projects state={projects} />
        <Experience state={experience} />
        <Education state={education} />
        <Awards state={awards} />
        <Contact />
        <Stats state={dashboard} projectNames={projectNames} />
      </main>
      <Footer info={info.data} />
    </div>
    </MotionConfig>
  );
}

export default App;
