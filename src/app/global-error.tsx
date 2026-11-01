"use client";

import { useEffect } from "react";
import "@/components/home/home.css";
import "@/components/listing/listing.css";
import { jakarta } from "./fonts";
import "./globals.css";

/** For when the page's outer frame is what failed, and for the pages outside the store's own error screens. It replaces the root layout, so it brings its own. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>Something went wrong | MatExpress</title>
        <div className="hm">
          <section className="hm-frame hm-notfound">
            <h1>Something went wrong on our side</h1>
            <p>Your cart is safe. Try again in a moment.</p>
            <div className="hm-notfound-actions">
              <button type="button" className="hm-btn hm-btn--accent" onClick={retry}>
                Try again
              </button>
              {/* A full page load on purpose: whatever broke may well be the app's own navigation. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="hm-btn hm-btn--ghost">
                Back to the store
              </a>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
