"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { CheckIcon, PlusIcon } from "./icons";

/** How long the button shows its tick after an add. */
const CONFIRM_MS = 1400;

type Props = {
  line: Omit<CartLine, "quantity">;
  /** A round icon button, or a full-width one with this text. */
  label?: string;
};

export function AddToCartButton({ line, label }: Props) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onAdd = () => {
    add(line);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), CONFIRM_MS);
  };

  return (
    <>
      <button
        type="button"
        className={label ? "hm-btn hm-btn--accent hm-btn--small hm-add-wide" : "hm-add"}
        data-added={added}
        aria-label={`${label ?? "Add"}: ${line.name}`}
        onClick={onAdd}
      >
        {added ? <CheckIcon /> : label ? null : <PlusIcon />}
        {label && (added ? "Added" : label)}
      </button>
      <span className="hm-sr" role="status">
        {added ? `${line.name} added to cart` : ""}
      </span>
    </>
  );
}
