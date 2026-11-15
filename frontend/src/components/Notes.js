import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { getNote, getNotes } from "../api";
import { renderMarkdown } from "../markdown";
import Section from "./Section";

function NoteModal({ noteId, onClose }) {
  const [note, setNote] = useState(null);

  useEffect(() => {
    getNote(noteId).then(setNote).catch(() => onClose());
  }, [noteId, onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink/90 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label={note?.title ?? "Note"}
      onClick={onClose}>
      <div className="glass-card mx-auto my-10 max-w-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              {note?.date}
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-white">
              {note?.title ?? "…"}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close note"
            className="rounded-lg border border-edge p-2 text-slate-400 transition-colors hover:border-accent/60 hover:text-accent">
            <FiX />
          </button>
        </div>
        {note ? (
          <div className="mt-4 text-sm" dangerouslySetInnerHTML={renderMarkdown(note.markdown)} />
        ) : (
          <p className="mt-4 animate-pulse font-mono text-sm text-slate-500">Loading…</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function Notes() {
  const [notes, setNotes] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    getNotes().then((data) => setNotes(data?.notes ?? [])).catch(() => setNotes([]));
  }, []);

  if (!notes?.length) return null;

  return (
    <Section id="notes" num="07" eyebrow="field notes" title="Notes">
      {() => (
      <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setOpenId(note.id)}
            className="glass-card p-5 text-left transition-colors hover:border-accent/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
              {note.date}
            </p>
            <h3 className="mt-2 font-display text-base font-semibold text-white">
              {note.title}
            </h3>
            {note.excerpt && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{note.excerpt}</p>
            )}
            <p className="mt-3 font-mono text-xs text-accent">read →</p>
          </button>
        ))}
      </div>
      {openId && <NoteModal noteId={openId} onClose={() => setOpenId(null)} />}
      </>
      )}
    </Section>
  );
}
