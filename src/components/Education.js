import Section from "./Section";

export default function Education({ state }) {
  return (
    <Section id="education" num="03" eyebrow="background" title="Education" state={state}>
      {(ed) => (
        <div className="glass-card max-w-2xl p-6">
          <h3 className="text-xl font-bold text-white">{ed.degree}</h3>
          <p className="mt-1 text-accent">{ed.institution}</p>
          <div className="mt-4 flex gap-3">
            <span className="chip">{ed.duration}</span>
            <span className="chip">DGPA {ed.dgpa}</span>
          </div>
        </div>
      )}
    </Section>
  );
}
