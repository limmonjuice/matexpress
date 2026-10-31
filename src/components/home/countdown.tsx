"use client";

import Link from "next/link";
import { useCountdown } from "@/hooks/use-countdown";
import { ArrowIcon } from "./icons";

const pad = (value: number) => String(value).padStart(2, "0");

/** The deal's timer and its button. A deal that has ended sends people to this week's deals instead. */
export function Countdown({ endsAt, href }: { endsAt: string; href: string }) {
  const { days, hours, minutes, seconds, expired, ready } = useCountdown(endsAt);

  if (ready && expired) {
    return (
      <Link href="/deals" className="hm-btn hm-btn--ink">
        See this week&apos;s deals <ArrowIcon />
      </Link>
    );
  }

  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Mins", value: minutes },
    { label: "Secs", value: seconds },
  ];

  return (
    <>
      <div className="hm-count" role="timer" aria-label="Time left on this deal">
        {units.map((unit) => (
          <div key={unit.label}>
            {/* Blank in the server's markup: the time left is only known in the browser. */}
            <b>{ready ? pad(unit.value) : "--"}</b>
            <small>{unit.label}</small>
          </div>
        ))}
      </div>
      <Link href={href} className="hm-btn hm-btn--ink">
        Shop the deal <ArrowIcon />
      </Link>
    </>
  );
}
