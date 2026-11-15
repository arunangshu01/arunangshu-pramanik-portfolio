// Tokenizes pretty-printed JSON into React elements (no innerHTML), so response
// content is always rendered as text.
const TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

const CLASSES = {
  key: "text-sky-300",
  string: "text-emerald-300",
  boolean: "text-violet-300",
  null: "text-slate-500",
  number: "text-amber-300",
};

export function highlightJson(text) {
  const parts = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [whole, str, colon, bool, nil, num] = match;
    const kind = str ? (colon ? "key" : "string") : bool ? "boolean" : nil ? "null" : num ? "number" : null;
    const value = str ?? whole;
    parts.push(
      <span key={index++} className={CLASSES[kind]}>
        {value}
      </span>
    );
    if (colon) parts.push(colon);
    last = match.index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
