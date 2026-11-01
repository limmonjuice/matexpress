import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { passwordProblem } from "@/lib/password-rules";
import { clearThrottle, consume } from "@/lib/throttle";

/** Tries on one account, wherever they come from: this is what stops someone who keeps changing address. */
const LOGIN_TRIES = { max: 10, window: 15 * 60 };

const loginKey = (email: unknown) => `login:${String(email ?? "").trim().toLowerCase().slice(0, 320)}`;

function refuseWeakPassword(password: unknown, about: unknown[]) {
  const problem = passwordProblem(password, about);
  if (problem) throw new APIError("BAD_REQUEST", { message: problem });
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: { enabled: true },
  },
  rateLimit: {
    customStorage: { consume },
    customRules: {
      // Asked constantly, and guessing would need the very token it checks.
      "/get-session": false,
      "/sign-up/email": { window: 60 * 60, max: 10 },
      "/delete-user": { window: 60, max: 5 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const { allowed } = await consume(loginKey(ctx.body?.email), LOGIN_TRIES);
        if (!allowed) throw new APIError("TOO_MANY_REQUESTS", { message: "Too many tries on this account. Wait 15 minutes, then try again." });
      }
      if (ctx.path === "/sign-up/email") {
        refuseWeakPassword(ctx.body?.password, [ctx.body?.email, ctx.body?.name]);
      }
      if (ctx.path === "/change-password") {
        const session = await getSessionFromCtx(ctx);
        refuseWeakPassword(ctx.body?.newPassword, [session?.user.email, session?.user.name]);
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // The right password wipes the slate, so nobody who signs in often ever meets the limit.
      if (ctx.path === "/sign-in/email" && ctx.context.newSession) {
        await clearThrottle(loginKey(ctx.body?.email)).catch(() => {});
      }
    }),
  },
  // nextCookies must be the last plugin so server actions can set cookies
  plugins: [nextCookies()],
});
