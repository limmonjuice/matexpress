import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/home/icons";
import { StoreShell } from "@/components/home/store-shell";
import "@/components/listing/listing.css";

export const metadata: Metadata = {
  title: "Page not found | MatExpress",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StoreShell>
      <section className="hm-frame hm-notfound hm-arrive">
        <svg className="hm-barricade" viewBox="0 0 320 150" aria-hidden="true">
          <g className="hm-barricade-legs">
            <path d="M58 150 74 30M262 150 246 30" />
          </g>
          <clipPath id="hm-barrier">
            <rect x="24" y="36" width="272" height="42" rx="6" />
          </clipPath>
          <rect x="24" y="36" width="272" height="42" rx="6" fill="#fff" />
          <g clipPath="url(#hm-barrier)" className="hm-barricade-stripes">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M${6 + i * 44} 78l42-42h22l-42 42z`} />
            ))}
          </g>
          <circle cx="74" cy="22" r="10" className="hm-barricade-lamp" />
          <circle cx="246" cy="22" r="10" className="hm-barricade-lamp" />
        </svg>
        <h1>This road is closed</h1>
        <p>The page you were looking for isn&apos;t here. The materials are all still on the main road.</p>
        <div className="hm-notfound-actions">
          <Link href="/categories" className="hm-btn hm-btn--accent">
            Browse materials <ArrowIcon />
          </Link>
          <Link href="/" className="hm-btn hm-btn--ghost">
            Back to the store
          </Link>
        </div>
      </section>
    </StoreShell>
  );
}
