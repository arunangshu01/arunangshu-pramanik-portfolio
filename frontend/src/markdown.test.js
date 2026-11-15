import { renderMarkdown } from "./markdown";

const html = (md) => renderMarkdown(md).__html;

test("soft-wrapped lines join into one paragraph", () => {
  const out = html("first line\nsecond line\n\nnew paragraph");
  expect(out.match(/<p /g)).toHaveLength(2);
  expect(out).toContain("first line second line");
});

test("bold spanning a soft wrap renders as bold", () => {
  const out = html("flushes them through **batch load\njobs**, which are free");
  expect(out).toContain("<strong>batch load jobs</strong>");
  expect(out).not.toContain("**");
});

test("list items keep indented continuation lines", () => {
  const out = html("- one\n  continued\n- two\n\nafter");
  expect(out).toContain("<li class=\"text-slate-300\">one continued</li>");
  expect(out).toContain(">two</li>");
  expect(out).toMatch(/<\/ul><p [^>]*>after<\/p>/);
});

test("escapes HTML everywhere", () => {
  const out = html("<script>alert(1)</script>\n\n```\n<img src=x>\n```\n\n- <b>x</b>");
  expect(out).not.toMatch(/<script|<img|<b>/);
  expect(out).toContain("&lt;script&gt;");
});

test("only http(s) links become anchors", () => {
  const out = html("[ok](https://example.com) [bad](javascript:alert(1))");
  expect(out).toContain('href="https://example.com"');
  expect(out).not.toContain("javascript:alert(1)\"");
});
