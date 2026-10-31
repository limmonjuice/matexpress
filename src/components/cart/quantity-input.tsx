"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/home/icons";
import { clampQuantity, type QuantityRules } from "@/lib/pricing";

const format = (value: number) => value.toLocaleString("en-PH", { maximumFractionDigits: 2 });

type Props = {
  value: number;
  rules: QuantityRules;
  /** What's being counted, for screen readers. */
  name: string;
  /** A settled quantity, with a note if it had to be changed from what was typed. */
  onChange: (quantity: number, note?: string) => void;
  /** Every keystroke that reads as a number, so what depends on it can react as people type. */
  onTyping?: (quantity: number) => void;
};

/** Buttons for a few, a field for five hundred: nobody should press plus 499 times. */
export function QuantityInput({ value, rules, name, onChange, onTyping }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const step = rules.step ?? 1;
  const min = rules.minQty ?? step;

  const settle = (raw: string | number) => {
    const { quantity, note } = clampQuantity(raw, rules);
    setDraft(null);
    onChange(quantity, note);
  };

  return (
    <div className="hm-qty">
      <button type="button" aria-label={`Fewer ${name}`} disabled={value <= min} onClick={() => settle(value - step)}>
        <MinusIcon />
      </button>
      <input
        type="text"
        inputMode={step < 1 ? "decimal" : "numeric"}
        aria-label={`Quantity of ${name}`}
        autoComplete="off"
        value={draft ?? format(value)}
        onFocus={(e) => {
          setDraft(String(value));
          // Select on the next frame: mouse-up would otherwise clear it.
          const field = e.currentTarget;
          requestAnimationFrame(() => field.select());
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const typed = Number(e.target.value.replace(/,/g, ""));
          if (Number.isFinite(typed) && typed > 0) onTyping?.(typed);
        }}
        onBlur={() => draft !== null && settle(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        aria-label={`More ${name}`}
        disabled={rules.stock !== undefined && value >= rules.stock}
        onClick={() => settle(value + step)}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
