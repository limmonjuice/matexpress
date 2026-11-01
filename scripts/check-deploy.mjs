// Checks a deployed copy of the store from the outside. Reads only: it places no order and fills no form.
// Usage: npm run check:deploy https://your-address
const base = process.argv[2]?.replace(/\/$/, "");
const local = base?.startsWith("http://localhost");
if (!base?.startsWith("https://") && !local) {
  console.error("Give the deployed https:// address: npm run check:deploy https://your-address");
  process.exit(1);
}

const PAGES = ["/", "/categories", "/categories/cement-concrete", "/products", "/products/portland-cement", "/deals", "/search?q=cement", "/sellers/tibay-steel", "/jobs/pouring-a-slab", "/help/delivery", "/sell", "/how-it-works", "/track", "/cart", "/saved", "/checkout", "/account"];
const SECURITY_HEADERS = ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "strict-transport-security"];

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "  ok " : "FAIL "} ${name}${detail ? `  (${detail})` : ""}`);
};
const get = async (path) => {
  const started = performance.now();
  const response = await fetch(base + path, { redirect: "manual" });
  const body = await response.text();
  return { response, body, ms: Math.round(performance.now() - started) };
};

console.log(`Checking ${base}\n\nEvery kind of page:`);
for (const path of PAGES) {
  const { response, ms } = await get(path);
  check(path, response.status === 200, `${response.status}, ${ms}ms`);
}
const missing = await get("/not-a-page");
check("an address that isn't a page gets a 404", missing.response.status === 404, String(missing.response.status));
const index = await get("/api/search-index");
check("the search list loads", index.response.status === 200 && index.body.length > 1000, `${index.body.length} bytes`);

console.log("\nSafety:");
const home = await get("/");
for (const header of SECURITY_HEADERS) check(header, home.response.headers.has(header));
if (!local) {
  const plain = await fetch(base.replace("https://", "http://"), { redirect: "manual" }).catch(() => null);
  check("plain http is sent to https", !plain || [301, 302, 307, 308].includes(plain.status), plain ? String(plain.status) : "no answer");
}

console.log("\nDemo or real store:");
const demo = home.body.includes("hm-demo-notice");
const robots = home.response.headers.get("x-robots-tag");
console.log(`  ${demo ? "This is set up as a public demo." : "This is set up as the real store."}`);
check(demo ? "search engines are told to stay away" : "search engines are welcome", demo ? robots === "noindex, nofollow" : !robots?.includes("noindex"), robots ?? "no header");

console.log("\nHosting:");
const dynamic = await get("/orders/MX-CHECKDPLY");
const served = dynamic.response.headers.get("x-vercel-id");
if (served) {
  // The last region named is where the server code ran. It has to match the database, in Singapore.
  const region = served.split("::").at(-2);
  check("server code runs next to the database", region === "sin1", `${served.split("::").slice(0, -1).join(" > ")}`);
  await get("/products/portland-cement");
  const again = await get("/products/portland-cement");
  const cache = again.response.headers.get("x-vercel-cache");
  check("a product page comes from the cache, not the server", cache === "HIT" || cache === "STALE", `${cache}, ${again.ms}ms`);
} else {
  console.log("  Not on Vercel, so the region and cache checks don't apply.");
}

console.log(failed ? `\n${failed} failed.` : "\nAll good. Now do the hands-on checks in docs/deploying.md.");
process.exit(failed ? 1 : 0);
