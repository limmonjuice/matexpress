"use client";

import { useEffect } from "react";
import { useQuoteStore } from "@/stores/quote-store";

export function AddToQuoteButton({ productId, name }: { productId: number; name: string }) {
  const add = useQuoteStore((state) => state.add);

  return (
    <button
      type="button"
      onClick={() => add({ productId, name })}
      className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
    >
      Add to quote
    </button>
  );
}

export function QuoteSummary() {
  const items = useQuoteStore((state) => state.items);
  const clear = useQuoteStore((state) => state.clear);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    useQuoteStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">
        Quote: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{count}</span> item
        {count === 1 ? "" : "s"}
      </span>
      {count > 0 && (
        <button
          type="button"
          onClick={clear}
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}
