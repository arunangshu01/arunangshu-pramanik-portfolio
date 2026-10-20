import { useEffect, useState } from "react";
import { useApi } from "./useApi";
import {
  getPersonalInfo,
  getProfileSummary,
  getSkills,
  getExperience,
  getEducationDetails,
  getAwards,
} from "./api";
import BootSequence from "./components/BootSequence";
import MusicToggle from "./components/MusicToggle";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Awards from "./components/Awards";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  const info = useApi(getPersonalInfo);
  const summary = useApi(getProfileSummary);
  const skills = useApi(getSkills);
  const experience = useApi(getExperience);
  const education = useApi(getEducationDetails);
  const awards = useApi(getAwards);
  const [light, setLight] = useState(
    () => localStorage.getItem("theme") === "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("theme", light ? "light" : "dark");
  }, [light]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent2/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-red-700/10 blur-[100px]" />
      </div>

      <BootSequence />
      <MusicToggle />
      <Navbar name={info.data?.name} light={light} onToggleTheme={() => setLight((v) => !v)} />
      <Hero info={info.data} summary={summary.data?.summary} />
      <main className="mx-auto max-w-5xl px-6">
        <Skills state={skills} />
        <Experience state={experience} />
        <Education state={education} />
        <Awards state={awards} />
        <Contact />
      </main>
      <Footer info={info.data} />
    </div>
  );
}

export default App;
