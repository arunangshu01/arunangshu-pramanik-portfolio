import Section from "./Section";

export default function Education({ state }) {
  return (
    <Section id="education" num="05" eyebrow="background" title="Education" state={state}>
      {(ed) => (
        <div className="glass-card max-w-2xl p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white sm:text-xl">{ed.degree}</h3>
          <p className="mt-1 text-accent">{ed.institution}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="chip">{ed.duration}</span>
            <span className="chip">DGPA {ed.dgpa}</span>
          </div>
        </div>
      )}
    </Section>
  );
}
