"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadTruck } from "@/components/cart/load-truck";
import { AlertIcon, ArrowIcon, CheckIcon, ChevronDownIcon } from "@/components/home/icons";
import { SellerMark } from "@/components/product/seller-mark";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNow } from "@/hooks/use-now";
import { authClient } from "@/lib/auth-client";
import { arrivalDate, bookableDays, dayKey, deliveryAreas, deliveryFee, DELIVERY_WINDOWS } from "@/lib/delivery";
import { formatPeso, plural } from "@/lib/format";
import { formatWeight, loadFor } from "@/lib/load";
import { listMySites, placeOrder, saveSite } from "@/lib/orders/actions";
import type { OrderProblem } from "@/lib/orders/price-order";
import { CHECKOUT_DRAFT_KEY, FIELD_LIMITS, formatMobile, PAYMENT_METHODS, TRUCK_ACCESS, validateCheckout, type CheckoutInput, type FieldErrors, type SiteFields } from "@/lib/orders/rules";
import { priceForQuantity } from "@/lib/pricing";
import { cartTotal, cartWeight, groupBySeller, lineCost, useCartStore } from "@/stores/cart-store";
import { usePreferences } from "@/stores/preferences-store";
import "./checkout.css";

type Draft = SiteFields & { truckAccess?: string; deliveryDate?: string; deliveryWindow: string; paymentMethod: string };

const article = (word: string) => (/^[aeiou6]/i.test(word) ? "an" : "a");

function readDraft(area: string): Draft {
  const empty: Draft = { contactName: "", mobile: "", street: "", city: "", area, notes: "", deliveryWindow: DELIVERY_WINDOWS[0], paymentMethod: "gcash" };
  try {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    return saved ? { ...empty, ...JSON.parse(saved) } : empty;
  } catch {
    return empty;
  }
}

/** Waits for the saved cart, so nothing renders from an empty one first. */
export function Checkout() {
  const cartReady = useHydrated(useCartStore);
  const preferencesReady = useHydrated(usePreferences);
  const router = useRouter();
  const count = useCartStore((s) => s.lines.length);
  const placed = useRef(false);

  useEffect(() => {
    if (cartReady && count === 0 && !placed.current) router.replace("/cart");
  }, [cartReady, count, router]);

  if (!cartReady || !preferencesReady || count === 0) return <div className="hm-co-wait" aria-busy="true" />;
  return <CheckoutForm onPlaced={() => (placed.current = true)} />;
}

function CheckoutForm({ onPlaced }: { onPlaced: () => void }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const preferredArea = usePreferences((s) => s.area);
  const setPreferredArea = usePreferences((s) => s.setArea);
  const now = useNow();
  const { data: session } = authClient.useSession();

  const [draft, setDraft] = useState<Draft>(() => readDraft(preferredArea));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problems, setProblems] = useState<OrderProblem[]>([]);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savedSites, setSavedSites] = useState<(SiteFields & { id: string })[]>([]);
  const [saveThisSite, setSaveThisSite] = useState(false);
  const attempt = useRef<string | null>(null);

  const total = cartTotal(lines);
  const fee = deliveryFee(draft.area, total);
  const weight = cartWeight(lines);
  const load = loadFor(weight);
  const groups = groupBySeller(lines);
  const slowest = Math.max(...lines.map((l) => l.leadDays));

  const days = useMemo(() => (now ? bookableDays(arrivalDate(now, slowest, draft.area)) : []), [now, slowest, draft.area]);
  const keys = days.map(dayKey);
  const deliveryDate = draft.deliveryDate && keys.includes(draft.deliveryDate) ? draft.deliveryDate : keys[0];

  // A refresh or a trip back to the cart shouldn't lose what was typed.
  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const fillSite = (site: SiteFields) => {
    setDraft((d) => ({ ...d, contactName: site.contactName, mobile: formatMobile(site.mobile), street: site.street, city: site.city, area: site.area, notes: site.notes ?? "" }));
    setPreferredArea(site.area);
    setErrors({});
  };

  // The usual site is ready to go, unless something has been typed already.
  const fillUsualSite = useEffectEvent((site: SiteFields) => {
    if (!draft.street && !draft.city) fillSite(site);
  });

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let live = true;
    listMySites()
      .then((sites) => {
        if (!live) return;
        setSavedSites(sites);
        if (sites[0]) fillUsualSite(sites[0]);
      })
      .catch(() => {}); // Saved sites are a shortcut. Without them the form still works.
    return () => {
      live = false;
    };
  }, [userId]);

  const submit = () => {
    if (pending) return;
    // One attempt, one key: pressing twice can't make two orders.
    attempt.current ??= crypto.randomUUID();
    const input: CheckoutInput = {
      idempotencyKey: attempt.current,
      site: { contactName: draft.contactName, mobile: draft.mobile, street: draft.street, city: draft.city, area: draft.area, notes: draft.notes },
      truckAccess: load.needsAccess ? draft.truckAccess : undefined,
      deliveryDate: deliveryDate ?? "",
      deliveryWindow: draft.deliveryWindow,
      paymentMethod: draft.paymentMethod,
      lines: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, sellerSlug: l.sellerSlug, quantity: l.quantity, unitPrice: priceForQuantity(l, l.quantity) })),
    };

    const found = validateCheckout(input, { needsAccess: load.needsAccess });
    setErrors(found);
    setProblems([]);
    setFailed(false);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid='true'] input")?.focus());
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrder(input);
        if (result.kind === "invalid") setErrors(result.errors);
        else if (result.kind === "changed") setProblems(result.problems);
        else {
          // The order is in by now, so a site that fails to save can't be allowed to look like a failed order.
          if (saveThisSite && userId) await saveSite(input.site).catch(() => {});
          onPlaced();
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          clearCart();
          router.replace(`/orders/${result.number}?placed=1`);
        }
      } catch {
        // The key is kept: trying again can't double the order if the first one got through.
        setFailed(true);
      }
    });
  };

  const summary = (
    <>
      <div className="hm-co-load">
        <LoadTruck lines={lines} />
        <p>
          <b>{formatWeight(weight)}</b>
          <span>
            {load.trips > 1 ? `${load.trips} trips by ${load.truck.name}` : `on ${article(load.truck.name)} ${load.truck.name}`}, {plural(groups.length, "seller")}
          </span>
        </p>
      </div>
      <ul className="hm-co-lines">
        {lines.map((line) => (
          <li key={line.id}>
            <span className="hm-co-thumb">
              <Image src={line.image} alt="" width={52} height={52} />
              <i>{line.quantity.toLocaleString("en-PH")}</i>
            </span>
            <span className="hm-co-line-name">
              <b>
                {line.name}
                {line.variantLabel ? `, ${line.variantLabel}` : ""}
              </b>
              <small>{line.seller}</small>
            </span>
            <strong>{formatPeso(lineCost(line))}</strong>
          </li>
        ))}
      </ul>
      <dl className="hm-co-totals">
        <div>
          <dt>Items</dt>
          <dd>{formatPeso(total)}</dd>
        </div>
        <div>
          <dt>Delivery to {draft.area}</dt>
          <dd>{fee === 0 ? "Free" : formatPeso(fee)}</dd>
        </div>
        <div className="hm-co-total">
          <dt>Total</dt>
          <dd>{formatPeso(total + fee)}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <form
      className="hm-co"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="hm-co-main">
        <h1>Check out</h1>

        <details className="hm-co-phone-summary">
          <summary>
            <span>Order summary</span>
            <b>{formatPeso(total + fee)}</b>
            <ChevronDownIcon />
          </summary>
          {summary}
        </details>

        {problems.length > 0 && (
          <div className="hm-co-alert" role="alert">
            <AlertIcon />
            <div>
              <b>Something in your cart changed, so nothing was charged.</b>
              <ul>
                {problems.map((problem, i) => (
                  <li key={i}>
                    {problem.kind === "price" && `${problem.name} is now ${formatPeso(problem.now)}, was ${formatPeso(problem.was)}.`}
                    {problem.kind === "quantity" && `${problem.name}: ${problem.note}`}
                    {problem.kind === "gone" && `${problem.name ?? "An item"} is no longer available from this seller.`}
                  </li>
                ))}
              </ul>
              <Link href="/cart" className="hm-link">
                Review your cart <ArrowIcon />
              </Link>
            </div>
          </div>
        )}
        {failed && (
          <div className="hm-co-alert" role="alert">
            <AlertIcon />
            <div>
              <b>We couldn&apos;t reach the store. Nothing was charged twice.</b>
              <p>Check your connection and press Place order again.</p>
            </div>
          </div>
        )}

        <section className="hm-co-step" aria-labelledby="hm-co-site">
          <h2 id="hm-co-site">Where&apos;s the site?</h2>
          {session?.user ? (
            <p className="hm-co-hint">Signed in as {session.user.email}.</p>
          ) : (
            <p className="hm-co-hint">
              No account needed. <Link href="/account?next=/checkout">Sign in</Link> if you have one.
            </p>
          )}

          {savedSites.length > 0 && (
            <div className="hm-co-sites" role="group" aria-label="Saved sites">
              {savedSites.map((site) => (
                <button type="button" key={site.id} aria-pressed={draft.street === site.street && draft.city === site.city} onClick={() => fillSite(site)}>
                  <b>{site.street}</b>
                  <small>
                    {site.city}, {site.area}
                  </small>
                </button>
              ))}
            </div>
          )}

          <div className="hm-co-fields">
            <Field label="Who should the driver ask for?" error={errors.contactName}>
              {(props) => <input {...props} autoComplete="name" maxLength={FIELD_LIMITS.contactName} value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />}
            </Field>
            <Field label="Mobile number" error={errors.mobile}>
              {(props) => <input {...props} type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={draft.mobile} onChange={(e) => set("mobile", e.target.value)} />}
            </Field>
            <Field label="Street and lot" error={errors.street} wide>
              {(props) => <input {...props} autoComplete="address-line1" maxLength={FIELD_LIMITS.street} value={draft.street} onChange={(e) => set("street", e.target.value)} />}
            </Field>
            <Field label="Barangay and city" error={errors.city}>
              {(props) => <input {...props} autoComplete="address-level2" maxLength={FIELD_LIMITS.city} value={draft.city} onChange={(e) => set("city", e.target.value)} />}
            </Field>
            <Field label="Area" error={errors.area}>
              {(props) => (
                <select
                  {...props}
                  value={draft.area}
                  onChange={(e) => {
                    set("area", e.target.value);
                    setPreferredArea(e.target.value);
                  }}
                >
                  {deliveryAreas.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <details className="hm-co-notes" open={Boolean(draft.notes)}>
            <summary>Add site notes for the driver</summary>
            <textarea
              rows={2}
              maxLength={FIELD_LIMITS.notes}
              aria-label="Site notes for the driver"
              placeholder="Gate color, landmark, who to call on arrival"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </details>

          {load.needsAccess && (
            <fieldset className="hm-co-access" data-invalid={Boolean(errors.truckAccess)}>
              <legend>
                This load needs {article(load.truck.name)} {load.truck.name}. Can it reach the gate?
              </legend>
              {TRUCK_ACCESS.map((option) => (
                <label key={option.id} data-selected={draft.truckAccess === option.id}>
                  <input type="radio" name="truckAccess" checked={draft.truckAccess === option.id} onChange={() => set("truckAccess", option.id)} />
                  {option.label}
                </label>
              ))}
              {errors.truckAccess && <p className="hm-co-error">{errors.truckAccess}</p>}
            </fieldset>
          )}

          {session?.user && (
            <label className="hm-co-check">
              <input type="checkbox" checked={saveThisSite} onChange={(e) => setSaveThisSite(e.target.checked)} />
              Save this site to my account
            </label>
          )}
        </section>

        <section className="hm-co-step" aria-labelledby="hm-co-when">
          <h2 id="hm-co-when">When should the truck come?</h2>
          <div className="hm-days" role="radiogroup" aria-label="Delivery day">
            {days.map((day, i) => {
              const [weekday, rest] = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric" }).format(day).split(", ");
              const [month, date] = rest.split(" ");
              const key = keys[i];
              return (
                <label key={key} data-selected={key === deliveryDate}>
                  <input type="radio" name="deliveryDate" checked={key === deliveryDate} onChange={() => set("deliveryDate", key)} />
                  <small>{weekday}</small>
                  <b>{date}</b>
                  <small>{month}</small>
                  {i === 0 && <em>Earliest</em>}
                </label>
              );
            })}
          </div>
          <div className="hm-windows" role="radiogroup" aria-label="Delivery window">
            {DELIVERY_WINDOWS.map((window) => (
              <label key={window} data-selected={draft.deliveryWindow === window}>
                <input type="radio" name="deliveryWindow" checked={draft.deliveryWindow === window} onChange={() => set("deliveryWindow", window)} />
                {window}
              </label>
            ))}
          </div>
          {errors.deliveryDate && <p className="hm-co-error">{errors.deliveryDate}</p>}
        </section>

        <section className="hm-co-step" aria-labelledby="hm-co-pay">
          <h2 id="hm-co-pay">How will you pay?</h2>
          <div className="hm-pay" role="radiogroup" aria-labelledby="hm-co-pay">
            {PAYMENT_METHODS.map((method) => (
              <label key={method.id} data-selected={draft.paymentMethod === method.id}>
                <input type="radio" name="paymentMethod" checked={draft.paymentMethod === method.id} onChange={() => set("paymentMethod", method.id)} />
                <span className="hm-pay-dot" aria-hidden="true">
                  {draft.paymentMethod === method.id && <CheckIcon />}
                </span>
                {method.label}
              </label>
            ))}
          </div>
          <p className="hm-co-test">Test checkout: no money moves, and no payment details are asked for. A real payment gateway plugs in here before launch.</p>
        </section>

        <div className="hm-co-place">
          <button type="submit" className="hm-btn hm-btn--accent hm-co-submit" disabled={pending}>
            {pending ? "Placing your order…" : `Place order, ${formatPeso(total + fee)}`}
            {!pending && <ArrowIcon />}
          </button>
          <p>
            One payment for {plural(groups.length, "seller")}. Damaged on arrival? <Link href="/help/returns">We replace it free.</Link>
          </p>
        </div>
      </div>

      <aside className="hm-co-side" aria-label="Order summary">
        <h2>Order summary</h2>
        <ol className="hm-co-route" aria-label="The route for this order">
          {groups.map((group) => (
            <li key={group.sellerSlug}>
              <SellerMark slug={group.sellerSlug} name={group.seller} />
              {group.seller}
            </li>
          ))}
        </ol>
        {summary}
      </aside>
    </form>
  );
}

type FieldProps = { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string };

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: (props: FieldProps) => React.ReactNode }) {
  const id = `hm-co-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="hm-co-field" data-wide={wide} data-invalid={Boolean(error)}>
      <label htmlFor={id}>{label}</label>
      {children({ id, ...(error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {}) })}
      {error && (
        <p className="hm-co-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
