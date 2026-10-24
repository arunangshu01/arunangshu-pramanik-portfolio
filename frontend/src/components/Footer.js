import ViewCounter from "./ViewCounter";

export default function Footer({ info }) {
  return (
    <footer className="border-t border-edge/60 px-4 pb-24 pt-10 text-center sm:pb-10">
      {info && (
        <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 font-mono text-sm text-slate-400">
          <a href={`mailto:${info.email}`} className="hover:text-accent">{info.email}</a>
          <span aria-hidden>·</span>
          <a href={`tel:${info.phone.replace(/[^+\d]/g, "")}`} className="hover:text-accent">{info.phone}</a>
        </p>
      )}
      <ViewCounter />
      <img src="/mask.svg" alt="" className="mx-auto mt-3 h-8 w-8 opacity-70" />
      <p className="mt-2 font-mono text-xs text-slate-600">
        designed & built by {info?.name ?? "Arunangshu Pramanik"} · React × FastAPI
      </p>
    </footer>
  );
}
