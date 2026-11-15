// Minimal markdown renderer for the Notes section. Escapes all HTML first, so
// the output is safe to inject via dangerouslySetInnerHTML.
const escapeHtml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const inline = (s) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 font-mono text-[0.9em] text-accent [overflow-wrap:anywhere]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2">$1</a>');

const codeBlock = (lines) =>
  `<pre class="my-3 overflow-x-auto rounded-lg border border-edge bg-ink/60 p-3 font-mono text-xs"><code>${escapeHtml(lines.join("\n"))}</code></pre>`;

const LIST_ITEM = /^[-*]\s+/;

export function renderMarkdown(markdown) {
  const blocks = [];
  let paragraph = [];
  let list = null; // array of items; each item is an array of lines
  let code = null;

  // Consecutive text lines form one paragraph (soft wraps), as in standard markdown.
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p class="my-2 leading-relaxed text-slate-300">${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.map((item) => `<li class="text-slate-300">${inline(item.join(" "))}</li>`);
      blocks.push(`<ul class="my-3 list-disc space-y-1 pl-5">${items.join("")}</ul>`);
      list = null;
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      if (code === null) {
        flushAll();
        code = [];
      } else {
        blocks.push(codeBlock(code));
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
      flushAll();
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const size = { 1: "text-xl", 2: "text-lg", 3: "text-base" }[level];
      blocks.push(`<h${level} class="mt-4 mb-2 font-display font-semibold text-white ${size}">${inline(heading[2])}</h${level}>`);
      continue;
    }
    if (LIST_ITEM.test(trimmed)) {
      flushParagraph();
      list = list ?? [];
      list.push([trimmed.replace(LIST_ITEM, "")]);
      continue;
    }
    if (list && /^\s/.test(line)) {
      // Indented continuation of the previous list item.
      list[list.length - 1].push(trimmed);
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushAll();
  if (code !== null) blocks.push(codeBlock(code));
  return { __html: blocks.join("") };
}
