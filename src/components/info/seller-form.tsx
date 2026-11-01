"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { ArrowIcon, CheckIcon, StarIcon, VerifiedIcon } from "@/components/home/icons";
import { sellerInitials } from "@/lib/format";
import { applyToSell } from "@/lib/orders/actions";
import { FIELD_LIMITS, SELLER_AWNINGS } from "@/lib/orders/rules";

/** A store's sign, as it would hang here. It changes as the name is typed. */
function StorePreview({ name, city, colour }: { name: string; city: string; colour: string }) {
  const shown = name.trim() || "Your Store";
  return (
    <div className="hm-storesign" aria-hidden="true">
      <svg viewBox="0 0 480 44" preserveAspectRatio="none">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${i * 40} 0h40v26a20 16 0 0 1-40 0z`} fill={i % 2 ? "#fff" : colour} style={{ transition: "fill 0.3s" }} />
        ))}
      </svg>
      <div>
        <span className="hm-mark" data-large="true" style={{ background: `${colour}26`, transition: "background-color 0.3s" }}>
          {sellerInitials(shown)}
        </span>
        <p>
          <b>{shown}</b>
          <small>
            <VerifiedIcon /> Verified by MatExpress
          </small>
          <small>
            {city.trim() || "Your city"} · <StarIcon /> New seller
          </small>
        </p>
      </div>
    </div>
  );
}

export function SellerForm() {
  const [state, action, pending] = useActionState(applyToSell, undefined);
  // Every field is held here: React clears uncontrolled fields after an action, even one that returned an error.
  const [fields, setFields] = useState({ storeName: "", contactName: "", mobile: "", city: "", sells: "" });
  const [colour, setColour] = useState<string>(SELLER_AWNINGS[0].colour);
  const field = (key: keyof typeof fields) => ({
    name: key,
    value: fields[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [key]: e.target.value })),
    required: true,
  });

  if (state?.done) {
    return (
      <div className="hm-applied-done" role="status">
        <span className="hm-order-tick">
          <CheckIcon />
        </span>
        <h3>Thanks, we have your application</h3>
        <p>Our team will call the number you gave to arrange a visit to your store.</p>
      </div>
    );
  }

  return (
    <div className="hm-apply">
      <StorePreview name={fields.storeName} city={fields.city} colour={colour} />
      <form action={action} className="hm-apply-form">
        <div className="hm-co-field">
          <label htmlFor="hm-apply-store">Store name</label>
          <input id="hm-apply-store" {...field("storeName")} maxLength={FIELD_LIMITS.storeName} autoComplete="organization" />
        </div>
        <fieldset className="hm-apply-colours">
          <legend>Awning colour</legend>
          {SELLER_AWNINGS.map((a) => (
            <label key={a.name} style={{ background: a.colour }} data-selected={a.colour === colour} aria-label={a.name}>
              <input type="radio" name="awning" value={a.name} checked={a.colour === colour} onChange={() => setColour(a.colour)} />
            </label>
          ))}
        </fieldset>
        <div className="hm-co-field">
          <label htmlFor="hm-apply-contact">Your name</label>
          <input id="hm-apply-contact" {...field("contactName")} maxLength={FIELD_LIMITS.contactName} autoComplete="name" />
        </div>
        <div className="hm-co-field">
          <label htmlFor="hm-apply-mobile">Mobile number</label>
          <input id="hm-apply-mobile" {...field("mobile")} type="tel" inputMode="tel" placeholder="0917 123 4567" autoComplete="tel" />
        </div>
        <div className="hm-co-field">
          <label htmlFor="hm-apply-city">City</label>
          <input id="hm-apply-city" {...field("city")} maxLength={FIELD_LIMITS.city} autoComplete="address-level2" />
        </div>
        <div className="hm-co-field">
          <label htmlFor="hm-apply-sells">What does your store sell?</label>
          <input id="hm-apply-sells" {...field("sells")} maxLength={FIELD_LIMITS.sells} placeholder="Cement, rebar, plumbing…" />
        </div>
        {state?.error && (
          <p className="hm-co-error" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" className="hm-btn hm-btn--accent hm-btn--block" disabled={pending}>
          {pending ? "Sending…" : "Apply to sell"}
          {!pending && <ArrowIcon />}
        </button>
      </form>
    </div>
  );
}
