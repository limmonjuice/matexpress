import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DemoNotice } from "./demo-notice";

afterEach(() => vi.unstubAllEnvs());

test("a public demo says so", () => {
  vi.stubEnv("SITE_MODE", "demo");
  render(<DemoNotice />);
  const notice = screen.getByRole("complementary", { name: "About this site" }).textContent;
  expect(notice).toMatch(/no money is taken/);
  expect(notice).toMatch(/use made-up details/);
});

test("the real store doesn't", () => {
  vi.stubEnv("SITE_MODE", "");
  const { container } = render(<DemoNotice />);
  expect(container.innerHTML).toBe("");
});
