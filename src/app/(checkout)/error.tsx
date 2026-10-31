"use client";

import { ErrorScreen } from "@/components/home/error-screen";

export default function CheckoutError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} back={{ href: "/cart", label: "Back to cart" }} />;
}
