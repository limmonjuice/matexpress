"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, CheckIcon } from "@/components/home/icons";
import { authClient } from "@/lib/auth-client";
import { buyAgain, claimOrder, forgetBrowserOrders, lookupOrder } from "@/lib/orders/actions";
import { CONNECTION_ERROR, friendlyAuthError } from "@/lib/orders/rules";
import { useCartStore } from "@/stores/cart-store";

export function CopyNumber({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="hm-copy"
      onClick={async () => {
        await navigator.clipboard?.writeText(number);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <CheckIcon /> : null}
      {copied ? "Copied" : "Copy number"}
    </button>
  );
}

/** Asks again every 20 seconds, so a tracking page left open keeps up by itself. */
export function LiveRefresh({ stop }: { stop: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (stop) return;
    const id = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(id);
  }, [router, stop]);
  return null;
}

export function BuyAgainButton({ number, label = "Buy again" }: { number: string; label?: string }) {
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);
  const [pending, startTransition] = useTransition();
  const [missing, setMissing] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hm-btn hm-btn--ghost hm-btn--small"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            try {
              const { lines, unavailable } = await buyAgain(number);
              lines.forEach(({ quantity, ...line }) => add(line, quantity));
              setMissing(unavailable);
              if (lines.length) openCart();
            } catch {
              setFailed(true);
            }
          })
        }
      >
        {pending ? "Adding…" : label}
      </button>
      {missing.length > 0 && <p className="hm-qty-note">No longer available: {missing.join(", ")}.</p>}
      {failed && (
        <p className="hm-qty-note" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </>
  );
}

/** For a shared computer: this browser stops opening these orders. Their number and mobile still will. */
export function ForgetOrdersButton() {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        className="hm-copy hm-forget"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            try {
              await forgetBrowserOrders();
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full page load: pages kept alive in the background still hold these orders.
              window.location.assign("/track");
            } catch {
              setFailed(true);
            }
          })
        }
      >
        {pending ? "Forgetting…" : "Forget these on this computer"}
      </button>
      {failed && (
        <p className="hm-qty-note" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </>
  );
}

export function TrackForm({ initialNumber = "" }: { initialNumber?: string }) {
  const [state, action, pending] = useActionState(lookupOrder, undefined);
  // Held here so a wrong number or mobile can be corrected: React clears uncontrolled fields after an action.
  const [number, setNumber] = useState(initialNumber);
  const [mobile, setMobile] = useState("");
  return (
    <form action={action} className="hm-trackform">
      <div className="hm-co-field">
        <label htmlFor="hm-track-number">Order number</label>
        <input id="hm-track-number" name="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="MX-7K3F9QPT" autoComplete="off" autoCapitalize="characters" required />
      </div>
      <div className="hm-co-field">
        <label htmlFor="hm-track-mobile">Mobile number on the order</label>
        <input id="hm-track-mobile" name="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" inputMode="tel" placeholder="0917 123 4567" autoComplete="tel" required />
      </div>
      {state?.error && (
        <p className="hm-co-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn--accent" disabled={pending}>
        {pending ? "Looking…" : "Track this order"}
        {!pending && <ArrowIcon />}
      </button>
    </form>
  );
}

/** Offered only after the order is in: an account is a convenience, never the price of buying. */
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
        <small id="hm-offer-password-rule">At least 8 characters.</small>
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
