// Follows every internal link from the home page and fails on any that don't open.
// Run against a running server: npm run check:links [base-url]
const base = process.argv[2] ?? "http://localhost:3000";
const seen = new Map();
const queue = ["/"];
const SKIP = /^\/(_next|api)\//;

// A list's many filter combinations are the same page, so check each one once.
const key = (path) => {
  const url = new URL(path, base);
  const params = [...new Set(url.searchParams.keys())].sort().join(",");
  return url.pathname + (params ? `?${params}` : "");
};

while (queue.length) {
  const path = queue.shift();
  const id = key(path);
  if (seen.has(id)) continue;
  const res = await fetch(new URL(path, base), { redirect: "follow" });
  seen.set(id, { path, status: res.status });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) continue;
  const html = await res.text();
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"#]+)/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (!href.startsWith("/") || href.startsWith("//") || SKIP.test(href)) continue;
    if (!seen.has(key(href))) queue.push(href);
  }
}

const broken = [...seen.values()].filter((page) => page.status >= 400);
console.log(`${seen.size} pages checked, ${broken.length} broken`);
for (const page of broken) console.log(`  ${page.status} ${page.path}`);
process.exit(broken.length ? 1 : 0);
