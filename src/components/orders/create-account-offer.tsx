"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { claimOrder } from "@/lib/orders/actions";
import { CONNECTION_ERROR, friendlyAuthError, PASSWORD_HINT } from "@/lib/orders/rules";

/**
 * Offered only after the order is in: an account is a convenience, never the price of buying.
 * In its own file because it's the only thing here that needs the auth client, and /track, which
 * every page's header links to and so prefetches, shouldn't bring that along.
 */
export function CreateAccountOffer({ name, number }: { name: string; number: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="hm-offer-account"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          try {
            const { error: failed } = await authClient.signUp.email({ name, email, password });
            if (failed) {
              setError(friendlyAuthError(failed.message));
              return;
            }
            await claimOrder(number);
            router.refresh();
          } catch {
            setError(CONNECTION_ERROR);
          }
        });
      }}
    >
      <h2>Keep this order in an account</h2>
      <p>Track it from anywhere, reorder in one tap, and skip typing the site next time.</p>
      <div className="hm-co-field">
        <label htmlFor="hm-offer-email">Email</label>
        <input id="hm-offer-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="hm-co-field">
        <label htmlFor="hm-offer-password">Choose a password</label>
        <input id="hm-offer-password" type="password" autoComplete="new-password" minLength={8} aria-describedby="hm-offer-password-rule" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <small id="hm-offer-password-rule">{PASSWORD_HINT}</small>
      </div>
      {error && (
        <p className="hm-co-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn--ink hm-btn--block" disabled={pending}>
        {pending ? "Creating…" : "Create my account"}
      </button>
    </form>
  );
}
