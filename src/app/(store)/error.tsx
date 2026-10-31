"use client";

import { ErrorScreen } from "@/components/home/error-screen";

/** Inside the store's layout, so the header and cart stay put while one page is in trouble. */
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} back={{ href: "/categories", label: "Browse materials" }} />;
}
