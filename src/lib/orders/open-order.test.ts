import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findOrder: vi.fn(), currentUser: vi.fn(), mightBeSignedIn: vi.fn(), provenOrders: vi.fn() }));

vi.mock("./repo", () => ({ findOrder: mocks.findOrder }));
vi.mock("./session", () => ({ currentUser: mocks.currentUser, mightBeSignedIn: mocks.mightBeSignedIn, provenOrders: mocks.provenOrders }));

import { openOrder } from "./open-order";

const found = { order: { number: "MX-AAAA1111", userId: "owner" }, items: [], events: [] };
const signedInAs = (id: string | undefined) => {
  mocks.mightBeSignedIn.mockResolvedValue(true);
  mocks.currentUser.mockResolvedValue(id && { id });
};

describe("openOrder", () => {
  beforeEach(() => {
    mocks.findOrder.mockReset().mockResolvedValue(found);
    mocks.currentUser.mockReset().mockResolvedValue(undefined);
    mocks.mightBeSignedIn.mockReset().mockResolvedValue(false);
    mocks.provenOrders.mockReset().mockResolvedValue([]);
  });

  test("a stranger costs no query at all", async () => {
    expect((await openOrder("MX-AAAA1111")).found).toBeUndefined();
    expect(mocks.findOrder).not.toHaveBeenCalled();
    expect(mocks.currentUser).not.toHaveBeenCalled();
  });

  test("proof of a different order costs no query either", async () => {
    mocks.provenOrders.mockResolvedValue(["MX-BBBB2222"]);
    expect((await openOrder("MX-AAAA1111")).found).toBeUndefined();
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  test("proof of this order opens it", async () => {
    mocks.provenOrders.mockResolvedValue(["MX-AAAA1111"]);
    expect((await openOrder("MX-AAAA1111")).found).toBe(found);
  });

  test("the account that owns it can open it", async () => {
    signedInAs("owner");
    const opened = await openOrder("MX-AAAA1111");
    expect(opened.found).toBe(found);
    expect(opened.user).toEqual({ id: "owner" });
  });

  test("another account can't", async () => {
    signedInAs("someone-else");
    expect((await openOrder("MX-AAAA1111")).found).toBeUndefined();
  });

  test("a session cookie that's expired or made up opens nothing", async () => {
    signedInAs(undefined);
    const opened = await openOrder("MX-AAAA1111");
    expect(opened.found).toBeUndefined();
    expect(opened.user).toBeUndefined();
  });

  test("an order nobody owns can't be opened by being signed in", async () => {
    signedInAs("owner");
    mocks.findOrder.mockResolvedValue({ ...found, order: { ...found.order, userId: null } });
    expect((await openOrder("MX-AAAA1111")).found).toBeUndefined();
  });

  test("a number that doesn't exist opens nothing", async () => {
    signedInAs("owner");
    mocks.findOrder.mockResolvedValue(undefined);
    expect((await openOrder("MX-ZZZZZZZZ")).found).toBeUndefined();
  });
});
