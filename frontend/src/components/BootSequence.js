import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  "J.A.R.V.I.S. OS v7.4 - initializing…",
  "Loading portfolio modules… OK",
  "Arc reactor output… STABLE",
  "All systems nominal. Welcome.",
];

// The API scales to zero when idle, so a cold start can take 10-30s. Hold the
// boot screen until the first response lands (ready) so visitors never see a
// half-empty page, but never trap them longer than MAX_WAIT_MS.
const MIN_VISIBLE_MS = 2300;
const MAX_WAIT_MS = 20000;

export default function BootSequence({ ready = true, maxWait = MAX_WAIT_MS }) {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    const lineTimer = setInterval(
      () => setStep((s) => Math.min(s + 1, LINES.length)),
      420
    );
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const maxTimer = setTimeout(() => setGaveUp(true), maxWait);
    return () => {
      clearInterval(lineTimer);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [maxWait]);

  useEffect(() => {
    if (minElapsed && (ready || gaveUp)) setVisible(false);
  }, [minElapsed, ready, gaveUp]);

  const waiting = visible && minElapsed && !ready && !gaveUp;

  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-80 max-w-[85vw] font-mono text-sm">
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
            {waiting && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-500"
              >
                <span className="text-accent/60 mr-2">▸</span>
                Establishing connection to backend… {waitSeconds}s
              </motion.p>
            )}
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
