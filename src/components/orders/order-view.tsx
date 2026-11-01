import Image from "next/image";
import Link from "next/link";
import { LoadTruck } from "@/components/cart/load-truck";
import { CheckIcon } from "@/components/home/icons";
import { SellerMark } from "@/components/product/seller-mark";
import { listProducts } from "@/lib/catalog";
import { formatDay } from "@/lib/delivery";
import { formatPeso, plural } from "@/lib/format";
import { formatWeight, loadFor } from "@/lib/load";
import type { LoadedOrder } from "@/lib/orders/repo";
import { PAYMENT_METHODS, TRUCK_ACCESS, formatMobile } from "@/lib/orders/rules";
import { demoEvents, demoTimelineOn, STAGES, trackingView, type EventType } from "@/lib/orders/tracking";
import type { CartLine } from "@/stores/cart-store";
import { ClaimOrderButton } from "@/components/account/account-forms";
import { CreateAccountOffer } from "./create-account-offer";
import { BuyAgainButton, CopyNumber, LiveRefresh } from "./order-bits";
import "./orders.css";

const peso = (centavos: number) => formatPeso(centavos / 100);

const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** The order's day was saved as a date, not a moment, so it reads the same anywhere. */
const deliveryDay = (key: string) => formatDay(new Date(`${key}T12:00:00+08:00`));

export async function OrderView({ found, justPlaced, signedIn }: { found: LoadedOrder; justPlaced: boolean; signedIn: boolean }) {
  const { order, items, events } = found;
  const products = await listProducts();

  // The items saved their names and prices, but the truck's drawing needs what they weigh.
  const lines = items.map((item) => {
    const product = products.find((p) => p.slug === item.productSlug);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return {
      id: item.id,
      categorySlug: product?.categorySlug ?? "",
      weightKg: variant?.weightKg ?? 0,
      quantity: Number(item.quantity),
    } as CartLine;
  });
  const weight = lines.reduce((sum, l) => sum + l.weightKg * l.quantity, 0);
  const load = loadFor(weight);

  const sellers = [...new Map(items.map((i) => [i.sellerSlug, { slug: i.sellerSlug, name: i.sellerName }])).values()];
  const demo = demoTimelineOn();
  const tracked = [
    ...events.map((e) => ({ type: e.type as EventType, sellerSlug: e.sellerSlug, at: e.createdAt })),
    ...(demo ? demoEvents(order.createdAt, sellers, new Date()) : []),
  ];
  const view = trackingView(tracked, sellers);
  const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod;
  const access = TRUCK_ACCESS.find((a) => a.id === order.truckAccess)?.label;
  const firstName = order.contactName.split(" ")[0];

  return (
    <div className="hm-frame hm-order">
      <LiveRefresh stop={view.delivered} />

      <header className="hm-order-head">
        {justPlaced ? (
          <>
            <span className="hm-order-tick" aria-hidden="true">
              <CheckIcon />
            </span>
            <h1>Thanks, {firstName}. Your order is in.</h1>
          </>
        ) : (
          <h1>Order {order.number}</h1>
        )}
        <div className="hm-order-number">
          {justPlaced && (
            <p>
              Order number <b>{order.number}</b>
            </p>
          )}
          <CopyNumber number={order.number} />
        </div>
        {justPlaced && !signedIn && <p className="hm-order-keep">Keep this number. With your mobile, it opens this page from any phone.</p>}
      </header>

      <section className="hm-track" aria-label="Where your order is">
        <div className="hm-track-top">
          <div>
            <p className="hm-track-when">{view.delivered ? "Delivered" : `Arrives ${deliveryDay(order.deliveryDate)}`}</p>
            <p className="hm-track-window">
              {view.delivered ? `To ${order.street}` : `${order.deliveryWindow}, ${order.street}, ${order.area}`}
            </p>
          </div>
          <p className="hm-track-truck-name">
            {formatWeight(weight)}, {load.trips > 1 ? `${load.trips} trips by ` : "on a "}MatExpress {load.truck.name}
          </p>
        </div>

        <div className="hm-track-road" style={{ "--hm-stage": view.stage / (STAGES.length - 1) } as React.CSSProperties}>
          <div className="hm-track-truck">
            <LoadTruck lines={lines} />
          </div>
          <ol>
            {STAGES.map((stage, i) => (
              <li key={stage} data-state={i < view.stage || view.delivered ? "done" : i === view.stage ? "now" : "next"}>
                <i aria-hidden="true">{(i < view.stage || view.delivered) && <CheckIcon />}</i>
                <span>
                  {stage}
                  {i === 1 && view.stage <= 1 && (
                    <small>
                      {view.confirmed} of {view.sellerCount}
                    </small>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {demo && <p className="hm-track-demo">Demo timeline: this progress is simulated until sellers and drivers are on the system.</p>}
      </section>

      <div className="hm-order-grid hm-arrive">
        <div className="hm-order-col">
          <section className="hm-order-card" aria-labelledby="hm-order-items">
            <h2 id="hm-order-items">{view.delivered ? "What came" : "What's coming"}</h2>
            {sellers.map((seller) => (
              <div key={seller.slug} className="hm-order-seller">
                <p className="hm-order-seller-name">
                  <SellerMark slug={seller.slug} name={seller.name} />
                  <Link href={`/sellers/${seller.slug}`}>{seller.name}</Link>
                  <small>{tracked.some((e) => e.type === "seller-confirmed" && e.sellerSlug === seller.slug) ? "Confirmed" : "Waiting to confirm"}</small>
                </p>
                <ul>
                  {items
                    .filter((item) => item.sellerSlug === seller.slug)
                    .map((item) => (
                      <li key={item.id}>
                        <Link href={`/products/${item.productSlug}?size=${item.variantId}`} className="hm-cart-thumb hm-order-thumb" aria-label={item.name}>
                          <Image src={item.image} alt="" width={64} height={64} />
                        </Link>
                        <span>
                          <b>
                            {item.name}
                            {item.variantLabel ? `, ${item.variantLabel}` : ""}
                          </b>
                          <small>
                            {Number(item.quantity).toLocaleString("en-PH")} {item.unit} at {peso(item.unitPriceCentavos)}
                          </small>
                        </span>
                        <strong>{peso(item.lineTotalCentavos)}</strong>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <dl className="hm-order-totals">
              <div>
                <dt>Items</dt>
                <dd>{peso(order.subtotalCentavos)}</dd>
              </div>
              <div>
                <dt>Delivery to {order.area}</dt>
                <dd>{order.deliveryFeeCentavos === 0 ? "Free" : peso(order.deliveryFeeCentavos)}</dd>
              </div>
              <div className="hm-order-total">
                <dt>Total</dt>
                <dd>{peso(order.totalCentavos)}</dd>
              </div>
            </dl>
            <div className="hm-order-again">
              <BuyAgainButton number={order.number} label="Add everything to the cart again" />
            </div>
          </section>

          <section className="hm-order-card" aria-labelledby="hm-order-history">
            <h2 id="hm-order-history">What&apos;s happened so far</h2>
            <ol className="hm-history">
              {view.history.map((entry, i) => (
                <li key={`${entry.at.getTime()}-${i}`}>
                  <time>{timeFormat.format(entry.at)}</time>
                  <span>{entry.text}</span>
                </li>
              ))}
            </ol>
            {view.delivered ? (
              <p className="hm-history-note">A signed photo from the driver appears here once drivers are on the system.</p>
            ) : (
              <p className="hm-history-note">You&apos;ll get a signed photo from the driver when it arrives.</p>
            )}
          </section>
        </div>

        <aside className="hm-order-col">
          <section className="hm-order-card" aria-labelledby="hm-order-site">
            <h2 id="hm-order-site">{view.delivered ? "Delivered to" : "Delivering to"}</h2>
            <address>
              <b>{order.contactName}</b>
              {formatMobile(order.mobile)}
              <br />
              {order.street}
              <br />
              {order.city}, {order.area}
            </address>
            {order.notes && <p className="hm-order-note">Note for the driver: {order.notes}</p>}
            {access && <p className="hm-order-note">Truck access: {access}.</p>}
          </section>

          <section className="hm-order-card" aria-labelledby="hm-order-payment">
            <h2 id="hm-order-payment">Payment</h2>
            <p>
              {payment}, {order.paymentRef?.startsWith("TEST-") ? "test payment, no money moved" : order.paymentStatus === "paid" ? "paid" : "not paid yet"}
            </p>
            <p className="hm-order-note">One payment covers {plural(sellers.length, "seller")}. MatExpress pays them once you&apos;ve received your order.</p>
          </section>

          {!signedIn && !order.userId && <CreateAccountOffer name={order.contactName} number={order.number} />}
          {signedIn && !order.userId && <ClaimOrderButton number={order.number} />}

          <p className="hm-order-help">
            Something wrong? <Link href="/help/contact">Contact us</Link> with your order number. Damaged goods are <Link href="/help/returns">replaced free</Link>.
          </p>
        </aside>
      </div>
    </div>
  );
}
