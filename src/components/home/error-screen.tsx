"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "@/components/listing/listing.css";

type Props = {
  error: unknown;
  retry: () => void;
  back: { href: string; label: string };
};

/** When a page fails. An order's number is the one thing nobody should lose, so its page still says it. */
export function ErrorScreen({ error, retry, back }: Props) {
  const { number } = useParams<{ number?: string }>();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="hm-frame hm-notfound hm-arrive">
      <h1>Something went wrong on our side</h1>
      <p>
        {number
          ? `Your order is safe. Keep its number, ${number.toUpperCase()}: with your mobile, it opens this page from any phone.`
          : "Your cart is safe. Try again in a moment."}
      </p>
      <div className="hm-notfound-actions">
        <button type="button" className="hm-btn hm-btn--accent" onClick={retry}>
          Try again
        </button>
        <Link href={back.href} className="hm-btn hm-btn--ghost">
          {back.label}
        </Link>
      </div>
    </section>
  );
}
