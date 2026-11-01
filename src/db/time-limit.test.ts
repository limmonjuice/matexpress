import { afterEach, expect, test, vi } from "vitest";
import { fetchWithin } from "./time-limit";

afterEach(() => vi.unstubAllGlobals());

test("a request nobody answers is given up on", async () => {
  vi.stubGlobal("fetch", (_: string, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason))));
  await expect(fetchWithin(20)("https://db.example/sql")).rejects.toMatchObject({ name: "TimeoutError" });
});

test("what the driver asked for still goes through", async () => {
  const send = vi.fn(async () => new Response("rows"));
  vi.stubGlobal("fetch", send);
  const answer = await fetchWithin(1000)("https://db.example/sql", { method: "POST", body: "select 1" });
  expect(await answer.text()).toBe("rows");
  expect(send).toHaveBeenCalledWith("https://db.example/sql", expect.objectContaining({ method: "POST", body: "select 1" }));
});
