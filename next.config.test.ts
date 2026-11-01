import { describe, expect, test } from "vitest";
import nextConfig from "./next.config";

async function headersOnEveryPage() {
  const rules = await nextConfig.headers!();
  const everywhere = rules.find((rule) => rule.source === "/(.*)")!;
  return Object.fromEntries(everywhere.headers.map(({ key, value }) => [key, value]));
}

describe("security headers", () => {
  test("every page gets them", async () => {
    const headers = await headersOnEveryPage();
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=\d{8}/);
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  test("the content policy loads nothing from anywhere else, and no one can frame the site", async () => {
    const policy = (await headersOnEveryPage())["Content-Security-Policy"];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toMatch(/https?:/);
    expect(policy).not.toContain("unsafe-eval");
  });

  test("the site doesn't announce what it's built on", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
