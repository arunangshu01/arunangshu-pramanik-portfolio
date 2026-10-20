import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { TbVolume, TbVolumeOff } from "react-icons/tb";

export default function MusicToggle() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.volume = 0.35;
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/ambient.m4a" loop preload="none" />
      <motion.button
        onClick={toggle}
        aria-label={playing ? "Mute ambient audio" : "Play ambient audio"}
        title={playing ? "sound off" : "sound on"}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border text-lg transition-colors ${
          playing
            ? "border-accent/60 bg-surface text-accent reactor-glow"
            : "border-edge bg-surface/80 text-slate-500 hover:border-accent/40 hover:text-accent"
        }`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        {playing ? <TbVolume /> : <TbVolumeOff />}
        {playing && (
          <motion.span
            className="absolute inset-0 rounded-full border border-accent/40"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
      </motion.button>
    </>
  );
}
