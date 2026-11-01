import { describe, expect, test } from "vitest";
import { passwordProblem } from "./password-rules";

describe("passwordProblem", () => {
  test.each([
    "password",
    "Password",
    "PASSWORD1",
    "password123",
    "Password123!",
    "P@ssw0rd",
    "p@ssw0rd2026",
    "passw0rd!",
    "12345678",
    "123456789012",
    "87654321",
    "qwertyuiop",
    "poiuytrewq",
    "qwerty123",
    "abcdefgh",
    "1q2w3e4r",
    "1qaz2wsx",
    "aaaaaaaa",
    "abcabcabc",
    "12341234",
    "iloveyou",
    "iloveyou2",
    "mahalkita123",
    "pilipinas1",
    "matexpress",
    "MatExpress2026",
    "welcome1",
    "admin1234",
    "letmein!",
  ])("%s is too easy to guess", (password) => {
    expect(passwordProblem(password)).toMatch(/too easy/);
  });

  test.each(["09171234567", "20261101", "19991231"])("%s is only numbers, and short enough to try them all", (password) => {
    expect(passwordProblem(password)).toMatch(/too easy/);
  });

  test.each(["Semento bakal 2026 ulan", "blue-truck-rebar-42", "TibayHollowBlocks9", "correct horse battery staple", "x7#Lq9!vT2", "394028571640"])("%s is fine", (password) => {
    expect(passwordProblem(password)).toBeUndefined();
  });

  test("a common word inside a longer passphrase is fine", () => {
    expect(passwordProblem("my password is a long sentence")).toBeUndefined();
  });

  test("a password built on your own name or email won't do", () => {
    const about = ["rosa.santos@example.com", "Rosa Santos"];
    expect(passwordProblem("Santos2026!", about)).toMatch(/name and email/);
    expect(passwordProblem("r0sa-the-builder", about)).toMatch(/name and email/);
    expect(passwordProblem("purple-rosa-trucks", about)).toMatch(/name and email/);
  });

  test("short parts of a name don't count, and neither does the email's domain", () => {
    expect(passwordProblem("blue-truck-rebar-42", ["Al Ng", "al@example.com"])).toBeUndefined();
    expect(passwordProblem("my example bridge plans", ["rosa@example.com"])).toBeUndefined();
  });

  test("something that isn't text is left to the auth library's own checks", () => {
    expect(passwordProblem(undefined)).toBeUndefined();
    expect(passwordProblem(12345678)).toBeUndefined();
    expect(passwordProblem("blue-truck-rebar-42", [undefined, null, 5])).toBeUndefined();
  });

  test("words every object has don't trip it up", () => {
    expect(passwordProblem("constructor-toString-valueOf")).toBeUndefined();
    expect(passwordProblem("__proto__")).toBeUndefined();
  });
});
