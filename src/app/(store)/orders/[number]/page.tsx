import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackForm } from "@/components/orders/order-bits";
import { OrderView } from "@/components/orders/order-view";
import "@/components/checkout/checkout.css";
import "@/components/orders/orders.css";
import { canSeeOrder } from "@/lib/orders/proof";
import { findOrder } from "@/lib/orders/repo";
import { currentUser, provenOrders } from "@/lib/orders/session";

export const metadata: Metadata = {
  title: "Your order | MatExpress",
  robots: { index: false },
};

type Props = {
  params: Promise<{ number: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function OrderPage(props: Props) {
  return (
    <Suspense fallback={<div className="hm-frame hm-order" style={{ minHeight: "70vh" }} aria-busy="true" />}>
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({ params, searchParams }: Props) {
  const number = (await params).number.toUpperCase();
  const { placed } = await searchParams;
  const [found, user, proven] = await Promise.all([findOrder(number), currentUser(), provenOrders()]);

  // The same page whether the number is wrong or just not proven: a guess learns nothing.
  if (!found || !canSeeOrder(found.order, proven, user)) {
    return (
      <div className="hm-frame hm-trackpage">
        <div>
          <h1>Track your order</h1>
          <p>Enter the mobile number on this order to see it.</p>
        </div>
        <TrackForm initialNumber={number} />
      </div>
    );
  }

  return <OrderView found={found} justPlaced={placed === "1"} signedIn={Boolean(user)} />;
}
