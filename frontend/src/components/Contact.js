import { useState } from "react";
import { motion } from "framer-motion";
import { sendContactEmail, trackOnce } from "../api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ sending: false, ok: null, error: null });

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, ok: null, error: null });
    try {
      const res = await sendContactEmail(form);
      setStatus({ sending: false, ok: res.message, error: null });
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus({ sending: false, ok: null, error: error.message });
    }
  };

  const field =
    "w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-accent";

  return (
    <motion.section
      id="contact"
      className="scroll-mt-20 py-12 sm:scroll-mt-24 sm:py-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      onViewportEnter={() => trackOnce("section_view", "contact", { section: "contact" })}
      transition={{ duration: 0.6 }}
    >
      <p className="mb-2 font-mono text-sm uppercase tracking-widest text-accent">
        <span className="mr-3 text-slate-600">07 /</span>
        let's talk
      </p>
      <h2 className="section-title mb-10">
        <span className="shimmer-text">Contact</span>
      </h2>

      <form
        onSubmit={onSubmit}
        className="glass-card grid w-full gap-4 p-5 sm:grid-cols-2 sm:p-8"
      >
        <input name="name" placeholder="Your name" value={form.name} onChange={onChange} required className={field} />
        <input name="email" type="email" placeholder="Your email" value={form.email} onChange={onChange} required className={field} />
        <textarea name="message" placeholder="Your message" rows="6" value={form.message} onChange={onChange} required className={`${field} sm:col-span-2`} />
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={status.sending} className="btn-primary">
            {status.sending ? "Sending…" : "Send message"}
          </button>
          {status.ok && <p className="font-mono text-sm text-emerald-400">✓ {status.ok}</p>}
          {status.error && <p className="font-mono text-sm text-red-400">✗ {status.error}</p>}
        </div>
      </form>
    </motion.section>
  );
}
