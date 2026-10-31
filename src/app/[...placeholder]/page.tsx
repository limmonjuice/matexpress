import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/home/icons";
import { StoreShell } from "@/components/home/store-shell";

export const metadata: Metadata = {
  title: "Coming soon | MatExpress",
  robots: { index: false },
};

// Every store link that doesn't have a page yet lands here, so nothing on the home page dead-ends.
export default function PlaceholderPage() {
  return (
    <StoreShell>
      <section className="hm-frame hm-placeholder">
        <h1>This page is on the way</h1>
        <p>We&apos;re still building this part of MatExpress. The home page has everything that&apos;s ready today.</p>
        <Link href="/" className="hm-btn hm-btn--accent">
          Back to the store <ArrowIcon />
        </Link>
      </section>
    </StoreShell>
  );
}
