// Minimal markdown renderer for the Notes section. Escapes all HTML first, so
// the output is safe to inject via dangerouslySetInnerHTML.
const escapeHtml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const inline = (s) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 font-mono text-[0.9em] text-accent">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2">$1</a>');

export function renderMarkdown(markdown) {
  const blocks = [];
  let list = null;
  let code = null;

  const flushList = () => {
    if (list) {
      blocks.push(`<ul class="my-3 list-disc space-y-1 pl-5">${list.join("")}</ul>`);
      list = null;
    }
  };

  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      flushList();
      if (code === null) code = [];
      else {
        blocks.push(
          `<pre class="my-3 overflow-x-auto rounded-lg border border-edge bg-ink/60 p-3 font-mono text-xs"><code>${escapeHtml(code.join("\n"))}</code></pre>`
        );
        code = null;
      }
      continue;
    }
    if (code !== null) {
      code.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const size = { 1: "text-xl", 2: "text-lg", 3: "text-base" }[heading[1].length];
      blocks.push(`<h${heading[1].length} class="mt-4 mb-2 font-display font-semibold text-white ${size}">${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      list = list ?? [];
      list.push(`<li class="text-slate-300">${inline(trimmed.slice(2))}</li>`);
      continue;
    }
    flushList();
    blocks.push(`<p class="my-2 leading-relaxed text-slate-300">${inline(trimmed)}</p>`);
  }
  flushList();
  if (code !== null) {
    blocks.push(
      `<pre class="my-3 overflow-x-auto rounded-lg border border-edge bg-ink/60 p-3 font-mono text-xs"><code>${escapeHtml(code.join("\n"))}</code></pre>`
    );
  }
  return { __html: blocks.join("") };
}
