import { describe, expect, test } from "vitest";
import { canSeeOrder, readProof, signProof } from "./proof";

describe("order proof", () => {
  test("reads back what was signed", () => {
    expect(readProof(signProof(["MX-AAAA2222", "MX-BBBB3333"], "secret"), "secret")).toEqual(["MX-AAAA2222", "MX-BBBB3333"]);
  });

  test("a changed list proves nothing", () => {
    const [, signature] = signProof(["MX-AAAA2222"], "secret").split(".");
    const forged = `${Buffer.from(JSON.stringify(["MX-SOMEONES1"])).toString("base64url")}.${signature}`;
    expect(readProof(forged, "secret")).toEqual([]);
  });

  test("another secret proves nothing", () => {
    expect(readProof(signProof(["MX-AAAA2222"], "secret"), "other")).toEqual([]);
  });

  test("rubbish proves nothing", () => {
    expect(readProof(undefined, "secret")).toEqual([]);
    expect(readProof("", "secret")).toEqual([]);
    expect(readProof("not.a-proof", "secret")).toEqual([]);
    expect(readProof("no-dot", "secret")).toEqual([]);
  });

  test("keeps only the latest orders, so the cookie can't grow forever", () => {
    const many = Array.from({ length: 30 }, (_, i) => `MX-${i}`);
    expect(readProof(signProof(many, "secret"), "secret")).toHaveLength(20);
  });
});

describe("canSeeOrder", () => {
  const guestOrder = { number: "MX-AAAA1111", userId: null };
  const accountOrder = { number: "MX-BBBB2222", userId: "u1" };

  test("a browser with no proof and no account sees nothing", () => {
    expect(canSeeOrder(guestOrder, [])).toBe(false);
    expect(canSeeOrder(accountOrder, [])).toBe(false);
  });

  test("proving one order doesn't open another", () => {
    expect(canSeeOrder(guestOrder, ["MX-BBBB2222"])).toBe(false);
    expect(canSeeOrder(guestOrder, ["MX-AAAA1111"])).toBe(true);
  });

  test("an account opens its own orders, not anyone else's", () => {
    expect(canSeeOrder(accountOrder, [], { id: "u1" })).toBe(true);
    expect(canSeeOrder(accountOrder, [], { id: "u2" })).toBe(false);
    expect(canSeeOrder(guestOrder, [], { id: "u1" })).toBe(false);
  });
});
