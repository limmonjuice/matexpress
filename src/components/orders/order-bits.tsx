"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, CheckIcon } from "@/components/home/icons";
import { buyAgain, forgetBrowserOrders, lookupOrder } from "@/lib/orders/actions";
import { CONNECTION_ERROR } from "@/lib/orders/rules";
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

const REFRESH_EVERY = 60_000;

/**
 * Keeps a tracking page current while someone can see it. A hidden tab stops asking: each ask
 * wakes the database, which then stays awake and on the bill for five more minutes.
 */
export function LiveRefresh({ stop }: { stop: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (stop) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const keepAsking = () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(() => router.refresh(), REFRESH_EVERY);
    };
    const onVisibilityChange = () => {
      if (!document.hidden) router.refresh(); // Back on the page: catch up now, not a minute from now.
      keepAsking();
    };
    keepAsking();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
