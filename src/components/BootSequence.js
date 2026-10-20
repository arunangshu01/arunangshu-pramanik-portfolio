import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "J.A.R.V.I.S. OS v7.4 — initializing…",
  "Loading portfolio modules… OK",
  "Arc reactor output… STABLE",
  "All systems nominal. Welcome.",
];

export default function BootSequence() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const lineTimer = setInterval(
      () => setStep((s) => Math.min(s + 1, LINES.length)),
      420
    );
    const exitTimer = setTimeout(() => setVisible(false), 2300);
    return () => {
      clearInterval(lineTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-80 font-mono text-sm">
            <motion.img
              src="/reactor.svg"
              alt=""
              className="reactor-glow mx-auto mb-8 h-24 w-24 rounded-full"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            />
            {LINES.slice(0, step).map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  i === LINES.length - 1 ? "text-accent" : "text-slate-500"
                }
              >
                <span className="text-accent/60 mr-2">▸</span>
                {line}
              </motion.p>
            ))}
            <motion.span
              className="mt-1 inline-block h-4 w-2 bg-accent"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
