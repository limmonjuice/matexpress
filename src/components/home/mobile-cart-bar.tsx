"use client";

import { formatPeso, plural } from "@/lib/format";
import { cartCount, cartTotal, useCartStore } from "@/stores/cart-store";
import { ArrowIcon } from "./icons";

/** On phones, a way to the cart stays under the thumb once something is in it. */
export function MobileCartBar() {
  const lines = useCartStore((s) => s.lines);
  const open = useCartStore((s) => s.open);
  const count = cartCount(lines);

  return (
    <button type="button" className="hm-cartbar" data-show={count > 0} onClick={open} tabIndex={count > 0 ? 0 : -1}>
      <span>{plural(count, "item")}</span>
      <b>
        {formatPeso(cartTotal(lines))}
        <ArrowIcon />
      </b>
    </button>
  );
}
