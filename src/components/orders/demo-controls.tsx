"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { demoAdvanceOrder, demoRestartOrder } from "@/lib/orders/actions";
import { CONNECTION_ERROR } from "@/lib/orders/rules";
import type { NextStep } from "@/lib/orders/tracking";

/** Sellers and drivers aren't on the system yet, so for showing the store, this does their part. Only shown with ORDER_TIMELINE=demo. */
export function DemoControls({ number, steps, started }: { number: string; steps: NextStep[]; started: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      setFailed(false);
      try {
        await action();
        router.refresh();
      } catch {
        setFailed(true);
      }
    });

  return (
    <section className="hm-demo" aria-labelledby="hm-demo-title">
      <div>
        <h2 id="hm-demo-title">Demo controls</h2>
        <p>Do what the sellers and the driver would, and watch this page follow. Real buyers never see this.</p>
      </div>
      <div className="hm-demo-steps">
        {steps.map((step) => (
          <button
            key={`${step.type}:${step.sellerSlug ?? ""}`}
            type="button"
            className="hm-btn hm-btn--accent hm-btn--small"
            disabled={pending}
            onClick={() => run(() => demoAdvanceOrder(number, { type: step.type, sellerSlug: step.sellerSlug }))}
          >
            {step.label}
          </button>
        ))}
        {started && (
          <button type="button" className="hm-demo-again" disabled={pending} onClick={() => run(() => demoRestartOrder(number))}>
            Start over
          </button>
        )}
      </div>
      {failed && (
        <p className="hm-demo-failed" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </section>
  );
}
