import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/checkout-form";
import { listSellers } from "@/lib/catalog";
import { sellerDirectory } from "@/lib/catalog/card";

export const metadata: Metadata = {
  title: "Check out | MatExpress",
  robots: { index: false },
};

export default async function CheckoutPage() {
  return <Checkout sellers={sellerDirectory(await listSellers())} />;
}
