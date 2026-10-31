import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AddSiteForm, AuthForms, RemoveSiteButton, SignOutButton } from "@/components/account/account-forms";
import { CheckIcon } from "@/components/home/icons";
import { BuyAgainButton } from "@/components/orders/order-bits";
import "@/components/checkout/checkout.css";
import "@/components/orders/orders.css";
import { formatDay } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { ordersForUser, sitesForUser } from "@/lib/orders/repo";
import { formatMobile } from "@/lib/orders/rules";
import { currentUser } from "@/lib/orders/session";

export const metadata: Metadata = {
  title: "Your account | MatExpress",
  robots: { index: false },
};

type RawParams = Record<string, string | string[] | undefined>;

export default function AccountPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  return (
    <Suspense fallback={<div className="hm-frame hm-account" style={{ minHeight: "60vh" }} aria-busy="true" />}>
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AccountContent({ searchParams }: { searchParams: Promise<RawParams> }) {
  const [user, { next }] = await Promise.all([currentUser(), searchParams]);

  if (!user) {
    return (
      <div className="hm-frame hm-auth">
        <div className="hm-auth-pitch">
          <h1>Your account</h1>
          <ul>
            {["Every order and its tracking in one place", "Buy the same load again in one tap", "Your sites saved, so checkout takes seconds"].map((point) => (
              <li key={point}>
                <CheckIcon />
                {point}
              </li>
            ))}
          </ul>
          <p className="hm-auth-guest">
            You don&apos;t need one to buy. <Link href="/track">Track an order</Link> with just its number and your mobile.
          </p>
        </div>
        <AuthForms next={typeof next === "string" ? next : undefined} />
      </div>
    );
  }

  const [orders, sites] = await Promise.all([ordersForUser(user.id), sitesForUser(user.id)]);

  return (
    <div className="hm-frame hm-account">
      <div className="hm-account-head">
        <div>
          <h1>Hi, {user.name.split(" ")[0]}</h1>
          <p>{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="hm-account-grid">
        <section aria-labelledby="hm-account-orders">
          <h2 id="hm-account-orders">Your orders</h2>
          {orders.length === 0 ? (
            <p className="hm-account-empty">
              Nothing yet. <Link href="/categories">Explore materials</Link> and your orders will show up here.
            </p>
          ) : (
            <ul className="hm-orderlist">
              {orders.map((order) => (
                <li key={order.number}>
                  <span className="hm-orderlist-main">
                    <Link href={`/orders/${order.number}`}>{order.number}</Link>
                    <small>
                      {formatDay(new Date(`${order.deliveryDate}T12:00:00+08:00`))}, {order.street}
                    </small>
                  </span>
                  <strong>{formatPeso(order.totalCentavos / 100)}</strong>
                  <BuyAgainButton number={order.number} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="hm-account-sites">
          <h2 id="hm-account-sites">Your sites</h2>
          {sites.length > 0 && (
            <ul className="hm-sitelist">
              {sites.map((site) => (
                <li key={site.id}>
                  <span>
                    <b>{site.street}</b>
                    <small>
                      {site.city}, {site.area}
                      <br />
                      {site.contactName}, {formatMobile(site.mobile)}
                    </small>
                  </span>
                  <RemoveSiteButton id={site.id} label={site.street} />
                </li>
              ))}
            </ul>
          )}
          <AddSiteForm name={user.name} />
        </section>
      </div>
    </div>
  );
}
