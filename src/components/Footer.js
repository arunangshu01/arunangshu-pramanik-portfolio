export default function Footer({ info }) {
  return (
    <footer className="border-t border-edge/60 py-10 text-center">
      {info && (
        <p className="font-mono text-sm text-slate-400">
          {info.email} · {info.phone}
        </p>
      )}
      <p className="mt-2 font-mono text-xs text-slate-600">
        designed & built by {info?.name ?? "Arunangshu Pramanik"} · React × FastAPI
      </p>
    </footer>
  );
}
