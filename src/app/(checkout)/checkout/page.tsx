import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Check out | MatExpress",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <Checkout />;
}
