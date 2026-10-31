import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import { listProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";

export const metadata: Metadata = {
  title: "Your cart | MatExpress",
  robots: { index: false },
};

/** What the cart needs to check its lines and find cheaper sellers. The words stay on the server. */
const slim = (product: Product): Product => ({ ...product, description: "", highlights: [], related: undefined });

export default async function Cart() {
  const products = await listProducts();
  return <CartPage products={products.map(slim)} />;
}
