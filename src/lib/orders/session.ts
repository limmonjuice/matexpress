import "server-only";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { readProof, signProof } from "./proof";

const PROOF_COOKIE = "mx_orders";
const NINETY_DAYS = 60 * 60 * 24 * 90;

const secret = () => {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set. Add a long random string to .env.local.");
  return value;
};

export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user;
}

export async function provenOrders() {
  return readProof((await cookies()).get(PROOF_COOKIE)?.value, secret());
}

/** After signing out, a shared site-office computer can't reopen orders. Only callable from a Server Action. */
export async function forgetOrderAccess() {
  (await cookies()).delete(PROOF_COOKIE);
}

/** Lets this browser reopen an order. Only callable from a Server Action, where cookies can be set. */
export async function grantOrderAccess(number: string) {
  const current = await provenOrders();
  if (current.includes(number)) return;
  (await cookies()).set(PROOF_COOKIE, signProof([...current, number], secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: NINETY_DAYS,
    path: "/",
  });
}
