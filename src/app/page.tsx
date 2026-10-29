import { Suspense } from "react";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { AddToQuoteButton, QuoteSummary } from "@/components/quote-controls";

const priceFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            MatExpress
          </span>
          <QuoteSummary />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Construction Materials
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Cement, steel, aggregates and more, straight from the yard.
        </p>

        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </main>
    </div>
  );
}

async function ProductGrid() {
  // Read fresh stock and prices on every request.
  await connection();

  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.category), asc(products.name));

  if (rows.length === 0) {
    return (
      <p className="mt-10 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        No products yet. Run <code className="font-mono">npm run db:seed</code> to add sample items.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((product) => (
        <li
          key={product.id}
          className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            {product.category}
          </span>
          <h2 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{product.name}</h2>
          {product.description && (
            <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          )}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {priceFormatter.format(Number(product.price))}
              </p>
              <p className="text-xs text-zinc-500">
                per {product.unit} · {product.stock.toLocaleString()} in stock
              </p>
            </div>
            <AddToQuoteButton productId={product.id} name={product.name} />
          </div>
          <p className="mt-3 font-mono text-[11px] text-zinc-400">SKU {product.sku}</p>
        </li>
      ))}
    </ul>
  );
}

function ProductGridSkeleton() {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="h-48 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </ul>
  );
}
