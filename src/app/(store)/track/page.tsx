import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/orders/order-bits";
import "@/components/checkout/checkout.css";
import "@/components/orders/orders.css";
import { formatPeso } from "@/lib/format";
import { ordersByNumbers } from "@/lib/orders/repo";
import { provenOrders } from "@/lib/orders/session";

export const metadata: Metadata = {
  title: "Track an order | MatExpress",
  description: "Follow your delivery with your order number and mobile number. No account needed.",
};

async function RecentOrders() {
  const orders = await ordersByNumbers(await provenOrders());
  if (!orders.length) return null;
  return (
    <section className="hm-recent" aria-labelledby="hm-recent-title">
      <h2 id="hm-recent-title">Orders from this browser</h2>
      <ul className="hm-orderlist">
        {orders.map((order) => (
          <li key={order.number}>
            <span className="hm-orderlist-main">
              <Link href={`/orders/${order.number}`}>{order.number}</Link>
              <small>
                {order.street}, {order.area}
              </small>
            </span>
            <strong>{formatPeso(order.totalCentavos / 100)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TrackPage() {
  return (
    <div className="hm-frame hm-trackpage hm-arrive">
      <div>
        <h1>Where&apos;s my order?</h1>
        <p>Enter your order number and the mobile number on the order. No account needed.</p>
        <Suspense fallback={null}>
          <RecentOrders />
        </Suspense>
      </div>
      <TrackForm />
    </div>
  );
}
