# MatExpress Store Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every "This page is on the way" link on the home page with a working store: browse, compare sellers, cart, checkout, tracking and accounts.

**Architecture:** All store pages share one `(store)` layout, so the header and cart stay mounted between pages. Pages read products through one async module, `src/lib/catalog/index.ts`, so the source can move from sample data to Neon without touching a page. Filters, sorting and paging live in the URL and run in a pure, tested function on the server. Prices, dates and fees come from pure rule modules. Checkout sits outside the store layout, and the server recalculates every total before an order is saved.

**Tech Stack:** Next.js 16 App Router with Cache Components, TypeScript, plain CSS with the `hm-` prefix, Zustand, Drizzle and Neon, Better Auth, Vitest with Testing Library. Runway MCP for sample images.

**Spec:** the "Design brief" section below. There is no separate spec document.

## Status

Phases 1, 2 and 3 are built, except the two tasks that wait on the client. Where the build differs from the tasks below, this section is the record.

**Waiting on the client:**
- **Task 10, catalog into Neon: not done.** It needs the OK in Decision 1, which hasn't been given. Products, sellers, prices and stock stay typed sample data behind `src/lib/catalog/index.ts`. The order tables from that task were built without it.
- **Task 14, PayMongo: not done.** It needs a PayMongo account and test keys, which only the client can create. Checkout stays simulated behind `PaymentProvider`, in `src/lib/orders/simulated-payments.ts`, and says so on the page.

**Built differently:**
- **Placing an order doesn't lower stock.** Stock lives in the sample data, so there's nothing to decrement until Task 10. The check that two buyers can't both win the last unit moves to Task 10 with it. The server still refuses a quantity above the listed stock.
- **Orders insert through `db.batch`, not `withTransaction`.** `neon-http` throws on `db.transaction`, and a batch is atomic. `src/db/tx.ts` wasn't needed.
- **Order rules live in `src/lib/orders/`** as `rules.ts`, `price-order.ts`, `create-order.ts`, `tracking.ts`, `proof.ts`, `repo.ts`, `session.ts` and `actions.ts`, rather than the file names in Tasks 11 to 13. `canViewOrder` became `canSeeOrder` in `proof.ts`.
- **Checkout, order and account components are fewer files** than listed: `checkout-form.tsx`, `order-view.tsx`, `order-bits.tsx`, `account-forms.tsx`.
- **The old `products` table is untouched.** Task 10 was going to replace it.

**Rendering and database:** how each page is served, the rules for new code, and the design for Task 10's caching (one tag per product, not one for the whole catalog) are in `docs/rendering-and-data.md`. `ordersForUser` became `loadAccount`, and `findOrder` is one trip.

**Changed after the independent review:**
- **The order is saved before any charge,** as `pending`, then the payment is recorded. A failed save never charges, and two requests with one key charge once. Task 14 builds on this order.
- **The retry key lives in `sessionStorage` with a fingerprint of the order,** so a reply lost on a bad connection can't become a second order after a refresh, and a changed order is never answered with the old one.
- **Orders join an account only when asked.** Signing in claims nothing. `claimOrder(number)` runs from the offer on the order page or "Add to my account" on `/account`, and `/track` can forget this browser's orders. Anyone holding an order's number and mobile can still claim an unowned order. Only checking the mobile by SMS closes that, and SMS is out of scope for now.
- **Today's delivery windows close three hours before they end,** in `openWindows`, so the last one closes at the 2 PM cut-off.
- **The checkout's area is the store's one area,** not a copy in the draft.
- **Server Actions check what they're sent** with `isCheckoutInput` and `isSiteFields`, and `priceOrder` refuses a line listed twice.
- **Tabs share one cart** through `storage` events, and a browser that blocks storage still works for the length of a page.
- **Failures stay small:** each action shows its own message, and `error.tsx` in `(store)` and `(checkout)` catch the rest.

**Security hardening:** [SECURITY.md](../../../SECURITY.md) is the record of what's in place, what isn't and what has to be true before launch. It covers the shared rate limits (the `throttles` table), the password rules, security headers, and the change-password and delete-account screens.

**Added beyond the plan:**
- **Shop by job,** at `/jobs/[slug]`: the materials for a job, with a drawing of it.
- **Scale drawings** on the product page, generated from each size's real measurements.
- **Splitting an order** when no one seller holds the quantity: one button adds it from two sellers.
- **Sharing a saved list** by link.
- **A live store sign** on the seller application. The awning colour picked is stored with the application.
- **Signing out forgets the browser's orders and checkout draft,** for shared site-office computers.
- **Saved sites fill checkout by themselves,** unless something has been typed already.

**Checks:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run check:links`, browser flows in a real browser, the design inspector on each page type, and one independent review of the whole branch. Not checked: Safari, real iOS and Android touch, real payment.

**Design inspector, what stays and why:** it judges landing pages, so `focal-point`, `few-pictures`, `still-page` and `no-footage` don't apply to a cart, a form or a help page. `palette-cream` is the brand. `eyebrow` fires on the header's "Track order" link and on the last small line before a heading, none of them real labels. `numbering` is the deal countdown, `icon-cards` the gallery's thumbnails, and `side-scroll` and `edge-text` the rows meant to swipe. `shadow` is a selected control's outline, or the hero's floating cards.

## Design brief

### Every dead link, and what it becomes

| Link on the home page | Becomes | Phase |
|---|---|---|
| `/categories` (hero, footer, menu, empty cart) | Hub showing all 12 categories | 1 |
| `/categories/[slug]` (tiles, menu, category bar, deal) | Listing with filters and sorting | 1 |
| `/categories?sort=new`, `?sort=best` ("View all") | New `/products` listing of everything; these links change to `/products?sort=` | 1 |
| `/products/[slug]` (cards, hero cards, search suggestions) | Product page with seller comparison | 1 |
| `/search?q=` (search box) | Results, with help when nothing matches | 1 |
| `/deals` | Deals listing with the dated deal on top | 1 |
| `/saved` | Saved items, no account needed | 1 |
| New: `/cart` | Full cart grouped by seller | 1 |
| New: `/sellers/[slug]` | Seller's store page, linked from every seller name on a product page | 1 |
| `/checkout` | Enclosed checkout | 2 |
| New: `/orders/[number]` | Confirmation and tracking | 2 |
| `/track` | Find an order by number and mobile | 2 |
| `/account` | Sign in, order history, saved sites | 2 |
| `/sell`, `/sell/how-it-works`, `/sell/support` | Seller recruiting and application form | 3 |
| `/help/delivery`, `/help/returns`, `/help/contact` | Help pages | 3 |

### What the research says

Numbers are the share of benchmarked sites that fail, unless noted.

| Finding | Source | What we do |
|---|---|---|
| 80% of sites have serious listing-page flaws; 78% of mobile sites score poor to mediocre | Baymard PLP guide (Aug 2026), Product List UX 2025 | Treat the listing as a main page, not a template |
| Five essentials on each item, plus 1–3 category-specific attributes (50% fall short) | Baymard list information | Card gains a spec line; photo, name, price, rating and seller count stay |
| Combine sizes into one listing (42%) | Product List UX | One rebar product with size buttons, not one per diameter |
| Show price per unit (67% in lists, 81% on product pages) | Baymard | `₱21.67/m` beside `₱3,250 / box` |
| Multi-select within a filter (14%), counts beside each option | Baymard | Checkboxes with counts |
| Show applied filters with remove and clear all (20–28%) | Baymard | Chips above the results, on phones too |
| Sort by price, rating, best selling and newest (69%) | Product List UX | All four, in the URL |
| Sidebar on desktop, fixed Filter button and drawer on phones | Baymard PLP guide | Same |
| Load More beats endless scroll; Back returns to the same spot | Baymard PLP guide | "Show more" with the depth in the URL |
| Grid for visual products, list for spec-heavy ones | Baymard PLP guide | Grid on desktop, compact rows on phones, no toggle |
| Sizes as visible buttons, not a dropdown (57%) | Product Page UX 2026 | Size buttons |
| Total cost beside the buy button (67%) | Product Page UX 2026 | Items + delivery to the chosen area, shown before adding |
| Summarise the return policy on the page (44%) | Product Page UX 2026 | One-line summary and link |
| In-scale photo (37%) | Product Page UX 2026 | One in-use photo for each flagship product |
| Guests can save items (89% fail) | Product Page UX 2026 | Already true; `/saved` keeps it true |
| 39% abandon over extra fees, 21% over slow delivery, 19% over forced accounts | Baymard abandonment guide (May 2026) | Fee shown early, dates everywhere, guest checkout |
| Enclosed checkout, account creation only at confirmation | Same | Checkout has no site navigation; account offered after ordering |
| A checkout needs about 12 elements, 7 of them fields; the average shows 23 | Baymard checkout benchmark | Target met; see the checkout wireframe |
| Dates, not speeds (41% fail) | Baymard | "Arrives Tue, Nov 3", never "1–2 days" |
| Nearly 50% give no way out of a failed search | Baymard no-results | Related categories, alternative searches with previews, popular products, help |
| Tracking is the top account feature for 50% of shoppers; only 33% of sites show all six details | Baymard tracking | Date, progress, carrier, reference, history, contents, all on our site |
| Spec-heavy buyers need category-specific filters, and long lists need search | Baymard B2B, Grainger | Filters defined per category. Search inside a filter waits for a bigger catalog |
| A marketplace that owns logistics suits one cart and one order; separate hidden charges per seller get flagged by banks | Sharetribe | One charge to MatExpress; one delivery |
| Amazon's other-sellers link is easy to miss | Friedler et al. | Sellers are compared on the page itself. This is our main edge |
| GCash is about 38–41% of Philippine online payments, Maya 16%, cards 25%, cash on delivery 11–23% (sources differ) | Unbox, Shuttle | GCash first, then Maya, card, online banking |
| PayMongo covers these with a full test mode. QR Ph codes move real money even in test mode | PayMongo docs | Adapter for PayMongo; QR Ph stays off |
| Wilcon: ₱800 minimum delivery fee, no delivery windows listed, buyer pays gate and road fees | Wilcon delivery page (undated) | ₱800 sample fee, booked windows, truck-access question at checkout |

### What the live stores do

Visited 1 Nov 2026. Home Depot, Screwfix and Bunnings blocked automated visits, and so did Lowe's product pages, so those were not reviewed directly.

| Store | Worth copying | Skip |
|---|---|---|
| Lowe's listing | Stock count and delivery date on every card; shop-by-type tiles; filter chips | Long marketing text |
| Amazon listing and product | Date and fee on cards; "Buying choices from ₱X"; buy box with date, stock, seller and returns | Other sellers behind a small link; clutter |
| IKEA PH listing | Picture pills for sub-types; counts on filter values; "Show more"; calm cards | Inspirational banners above products |
| Grainger listing | Filters specific to the product type; searchable filter lists; stock filter | Paragraphs pushing products below the fold; 25+ filter groups for a small catalog |
| Wilcon (local) | `₱998 / PC`, "In stock" on the card, plain spec table | Lumber filters by price only; no delivery date on the listing or beside the buy button |

### Page designs

**Listing (desktop; phones get rows and a Filter button that sticks under the header)**

```
Home / Steel & Rebar
Steel & Rebar  28 products                        Sort: Best selling v
[o Deformed rebar] [o Tie wire] [o Angle bars] [o Pipes] [o Wire mesh]
+ Filters ------+  16 mm x   Grade 40 x   Clear all
| Diameter (5)  |  +--------+ +--------+ +--------+
| Grade    (2)  |  | photo <3 |        | |        |
| Price         |  | Tibay Steel (verified)
| Delivery      |  | Deformed Rebar
| Seller   (4)  |  | 16 mm, Grade 40, 6 m
| Brand         |  | * 4.7 (168)  4 sellers
| Rating        |  | P232 / length  P38.67/m
| In stock      |  | Arrives Tue, Nov 3    (+)
+---------------+  +--------+ +--------+ +--------+
                   Showing 12 of 28   [ Show more ]
```

Filtering by `16 mm` shows the 16 mm price on the card and opens the product on 16 mm.

**Product page (phones stack this and add a sticky price and Add bar)**

```
Home / Steel & Rebar / Deformed Rebar
+------------------+  Deformed Rebar       * 4.7 (168)
|                  |  Size [10 mm] [12 mm] [16 mm] [20 mm]
|     gallery      |  P232 / length   P38.67/m   was P245, 5% off
|  cut-out, in use |
|                  |  Compare 4 sellers
+------------------+  (o) Tibay Steel   P232  In stock  Arrives Tue, Nov 3
                      ( ) Bakal Supply  P236  In stock  Arrives Wed, Nov 4
                      ( ) Dalisay Hdwe  P241  Low stock Arrives Wed, Nov 4
                      Quantity [- 100 +]  [50] [100] [500]   P225 each at 100+
                      P22,500 + P800 delivery to Rizal   P2,500 to free delivery
                      [ Add to cart ]  <3
                      Damaged on arrival? Free replacement. See returns
Specs | About | Often bought with | Reviews (with rating bars)
```

**Cart**

```
Your cart                                    Order summary
Tibay Steel (verified)                       Items            P31,200
  Rebar 16 mm  [- 100 +]  P22,500            Delivery to Rizal   Free
Bato Aggregates (verified)                   Total            P31,200
  Washed Sand  [- 6 +]    P8,700             Arrives together Thu, Nov 5,
                                             set by Bato Aggregates
Price changed notices go here                [ Check out ]
```

**Checkout (no site navigation; summary always visible)**

```
MatExpress          Secure checkout            Back to cart
1 Delivery site  Sign in optional                Order summary
  Name, Mobile, Street, Barangay and city,       2 sellers, 1 delivery
  Area (prefilled), Can a 6-wheeler reach        Items, delivery, total
  the gate? (yes / small truck only / not sure),
  Add site notes (hidden until tapped)
2 Delivery window  [Thu Nov 5 v] [8 AM–12 NN] [1–5 PM]
3 Payment  (o) GCash ( ) Maya ( ) Card ( ) Online banking
[ Place order, P31,200 ]
```

That is six fields, one radio group, the window pickers and a payment choice. There is no email field yet, because nothing sends email.

**Tracking**

```
Order MX-7K3F9QPT                     Arrives Thu, Nov 5, 8 AM–12 NN
Placed - Sellers confirming (1 of 2) - Collecting - On the way - Delivered
MatExpress truck, driver details once it leaves
History with times       Contents with photos, sellers and total
Proof of delivery: signed photo, once delivered
```

### Decisions

1. **The catalog stays typed sample data through phase 1, then moves to Neon in Task 10.** Real orders need real stock, and the client can then edit prices in Drizzle Studio. This reverses your earlier "do not base product cards on the database", so it needs your OK before Task 10. Phase 1 does not depend on it.
2. **Delivery belongs to MatExpress, so seller coverage isn't a concept yet.** All sellers reach all five areas. The area changes only the fee and the date.
3. **One order, one fee, one delivery.** The date is the slowest seller's, and the cart names that seller so the buyer can switch. Sample fees: ₱800 for Metro Manila and Rizal, ₱1,000 for Cavite, Laguna and Bulacan, free from ₱25,000. Those three farther areas add one day. Dispatch cut-off is 2 PM Manila time.
4. **Payment is simulated until you add PayMongo test keys** (Task 14). You sign up yourself. No real money moves in either mode.
5. **No cash on delivery at first.** A refused truckload is costly, and the order is paid before sellers are. Easy to add with a limit if your client wants it.
6. **No email or SMS yet.** Pages never promise a message that won't arrive.
7. **Filters and search run on the server, with the state in the URL.** Lists can be shared, Back works, and the same code survives the move to Neon.
8. **Sample sellers and brands are fictional,** so nothing implies a deal with a real company.
9. **The search understands local words:** semento, CHB, yero, bakal, buhangin, graba, kahoy, pako, pintura, tubo, alambre.
10. **Volume prices and minimum orders are in the model,** because a buyer typing 500 hollow blocks is normal here. Quantity is a typed field with buttons and quick picks.
11. **Cart badge counts lines, not units,** so 500 blocks doesn't read "500".
12. **Images:** 36 new products, 12 in-use shots and 4 category tiles, 52 in all at about 4 credits each, roughly 208 of the 392 remaining. Spending stops at 220 without asking.
13. **`src/components/home/` keeps its name.** Renaming would touch 25 files for no user benefit. New areas get their own folders.

### Left out on purpose

Product-to-product compare, downloadable quotes, invoice details (TIN), vouchers, writing reviews, recently viewed, Buy Now, password reset, emails and SMS, the seller dashboard, and real truck GPS. The seller dashboard is the next big piece: without it, sellers cannot really confirm orders. No trade account and no slab estimator, per your earlier decision.

## Global Constraints

- Concept: a marketplace of hardware-company sellers; MatExpress handles delivery. Never mention Amazon on the site.
- Palette, type and spacing are the `.hm` tokens in `home.css`. Plus Jakarta Sans only. Nothing readable under 13 px. Touch targets at least 44 px. Container `max-width: 1320px`.
- New CSS uses the `hm-` prefix, in one file per area (`listing.css`, `product.css`, `cart.css`, `checkout.css`, `account.css`, `info.css`).
- Motion: reuse the home page's reveal and hover. No new motion unless asked. Nothing is gated on reduced motion.
- Next 16: read `node_modules/next/dist/docs/` before using an API. `searchParams`, `params` without static values, and `cookies()` sit behind `<Suspense>`. `generateStaticParams` returns at least one value. No `Date.now()` or `new Date()` during server render or client prerender; dates appear after mount, as `use-countdown` already does. Up to 3 routes stay alive hidden under `<Activity>`, so transient UI closes in a `useLayoutEffect` cleanup. `next/image` uses `preload`, not `priority`.
- Every page sets its title through `metadata` or `generateMetadata`.
- Money: pesos in the UI, whole centavos in order tables. The server recalculates totals and never trusts browser prices.
- Dates: Asia/Manila always.
- Invented reviews, demo order progress and simulated payment must never reach real customers. Each is switched off by one flag or one file.
- All sellers, brands, prices, stock, ratings, reviews, fees, policies, contact details and images are sample data, listed below for replacement before launch.
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Back from a product page** should return to the same filters, the same "Show more" depth and the same spot, under Lenis and `<Activity>`. Tested in Task 5.
2. **Bulk quantity input:** 500, blank, letters, 0, 1.2 m³, above stock, below minimum. A person expects a clear correction, never a silent change or a broken total. Tested in Tasks 3, 7 and 8.
3. **Stale carts:** a cart saved last week meets a new price, a sold-out offer or a removed product. A person expects to be told before paying. Tested in Tasks 8 and 11.
4. **Double taps and slow networks on Place order,** and refreshing the confirmation page. A person expects exactly one order. Tested in Task 11.
5. **Guessing an order number** must never reveal a name or address. Tested in Task 12.

---

Every task runs the same loop. Write the tests and run `npx vitest run <file>` to see them fail. Implement. Run them to see them pass. Then run `npx tsc --noEmit`, `npm run lint` and `npm test`, and commit.

## Phase 1: Browse and buy

### Task 1: Shared store layout

**Files:**
- Create: `src/app/(store)/layout.tsx`, `src/app/(store)/layout.test.tsx`, `src/app/not-found.tsx`
- Move: `src/app/page.tsx`, `src/app/page.test.tsx`, `src/app/[...placeholder]/` into `src/app/(store)/`
- Modify: the moved pages, which stop wrapping themselves in `StoreShell`

**Interfaces:** Produces the `(store)` route group. `/how-it-works` stays outside it.

- [x] **Step 1: Commit the finished home page first,** as a checkpoint. Review `git status`, confirm `.env.local` is ignored, then stage everything and commit `feat: storefront home page and how-it-works move`.
- [x] **Step 2: Test.** `"renders the header, footer and page once"`: render the layout with a child and assert one `banner`, one `contentinfo`, one child.
- [x] **Step 3: Implement.** The root `not-found.tsx` wraps itself in `StoreShell`, offers search and category links, and returns the correct 404.
- [x] **Step 4: Check in the browser.** Tag the header element, follow a client link, and confirm the tag survives. Round-trip to `/how-it-works` still works.
- [x] **Step 5: Commit** `refactor: share one store layout`.

### Task 2: Catalog model and sample data

**Files:**
- Modify: `src/lib/catalog/types.ts`, `src/lib/catalog/home-content.ts` (keeps marketing content only), `src/stores/cart-store.ts` (new line shape)
- Create: `src/lib/catalog/index.ts`, `card.ts`, `data/categories.ts`, `data/sellers.ts`, `data/products.ts`, `data/reviews.ts`, `catalog.test.ts`
- Create: `public/home/products/*`, `public/home/categories/*`

**Interfaces:**
- `Seller { slug, name, city, since, rating, reviewCount, blurb }`
- `Offer { sellerSlug, price, listPrice?, stock, leadDays, minQty?, step?, tiers?: { from, price }[] }`
- `Variant { id, label, spec, attributes: Record<string, string>, measure?: { per: "kg" | "m" | "L" | "m²", amount }, offers: Offer[] }`
- `Product { slug, name, brand, categorySlug, subcategory, unit, badge?, description, highlights, images: { src, kind: "cutout" | "in-use" }[], rating?, reviewCount?, ratingBars?, salesRank, addedAt, related?, variants: Variant[] }`
- `Category` gains `filters: { key, label }[]` and `blurb`. Filters, by category:
  - Cement: Type, Bag size
  - Steel: Diameter, Grade, Length
  - Sand: Size, Use
  - Lumber: Thickness, Grade
  - Roofing: Gauge, Length
  - Plumbing: Size, Material
  - Electrical: Wire size, Type
  - Tools: Power source, Standard
  - Masonry: Size, Type
  - Paint: Finish, Can size
  - Tiles: Size, Room
  - Hardware: Size, Material
- `CartLine { id, slug, variantId, variantLabel?, sellerSlug, seller, name, unit, price, tiers?, minQty?, step?, stock, leadDays, image, quantity }`. `id` is `slug:variantId:sellerSlug`. Persist `version: 2`; migrating from any older version empties the cart.
- `CardData { slug, href, name, spec, unit, image, price, listPrice?, unitPrice?, sellerCount, seller: { slug, name }, rating?, reviewCount?, badge?, leadDays, inStock, line: Omit<CartLine, "quantity"> }`
- `toCard(product, { variantId?, sellerSlug? }?): CardData`
- `listProducts(): Promise<Product[]>`, `getProduct(slug)`, `listCategories()`, `getCategory(slug)`, `listSellers()`, `getSeller(slug)`, `getReviews(slug)`
- Counts: Cement 5, Steel 6, Sand 3, Lumber 5, Roofing 4, Plumbing 5, Electrical 5, Tools 5, Masonry 3, Paint 3, Tiles 2, Hardware 2, 48 in all. Six fictional sellers, as on the home page. Subcategory lists shrink to those with products.
- All 12 categories get a tile image, so `featuredCategories` moves to a `featured` flag and the home page keeps its 8 tiles.

- [x] **Step 1: Tests.**
  - `"every offer points at a real seller"`
  - `"every image path exists in public/"`
  - `"every category has at least 2 products and every subcategory at least 1"`
  - `"minQty never exceeds stock on an in-stock offer"`
  - `"toCard picks the cheapest in-stock offer and breaks ties on lead time"`
  - `"toCard with a seller shows that seller's price, not the cheapest"`
  - `"toCard with a variant shows that variant's spec, price and ?size= href"`
  - `"a product out of stock everywhere is inStock false and keeps a price"`
  - `"version 1 carts migrate to empty"`
  - `"the home page still features 8 categories"`
- [x] **Step 2: Implement the data and API.** Home sections keep working through `toCard`. `search.ts` reads `data/products` until Task 6. Update home tests for the new shape.
- [x] **Step 3: Generate images.** Check the credit balance first. Nano Banana 2.1 in the existing look, flattened to `--hm-tile`. Show three samples before running the batch. Stop at 220 credits.
- [x] **Step 4: Commit** `feat: full sample catalog with sellers, sizes and offers`.

### Task 3: Delivery and pricing rules

**Files:** Create `src/lib/delivery.ts`, `delivery.test.ts`, `src/lib/pricing.ts`, `pricing.test.ts`.

**Interfaces:**
- `arrivalDate(now: Date, leadDays: number, area: string): Date`
- `formatDay(date: Date): string` gives `"Tue, Nov 3"`, in Manila time
- `deliveryFee(area: string, subtotal: number): number`
- `orderArrival(lines, now, area): { date: Date, setBy: string }`
- `priceForQuantity({ price, tiers? }, quantity): number`
- `QuantityRules { minQty?, step?, stock }`, which both `Offer` and `CartLine` satisfy
- `clampQuantity(raw: string | number, rules: QuantityRules): { quantity: number, note?: string }`
- `unitPriceLabel(price, measure): string | undefined`
- `lineTotal(price, quantity): number`

- [x] **Step 1: Tests.**
  - `arrivalDate(new Date("2026-11-02T13:59:00+08:00"), 0, "Rizal")` formats as `"Mon, Nov 2"`; at `14:00:00+08:00` it gives `"Tue, Nov 3"`.
  - Cavite, Laguna and Bulacan add one day; Metro Manila and Rizal add none.
  - The same instant gives the same day under `TZ=UTC`.
  - `deliveryFee("Rizal", 24999.99)` is 800, `deliveryFee("Rizal", 25000)` is 0, `deliveryFee("Cavite", 100)` is 1000.
  - `orderArrival` returns the slowest line's date and seller.
  - Tiers `[{from:100,price:14.5},{from:500,price:14}]` on a ₱15 offer: 99 gives 15, 100 gives 14.5, 500 gives 14.
  - `clampQuantity` with min 50, stock 120: `10` gives 50 with a note; `500` gives 120 with a note; `"abc"`, `""` and `0` give 50.
  - `clampQuantity` with step 0.5: `1.2` gives 1, `1.3` gives 1.5.
  - `unitPriceLabel(3250, {per:"m",amount:150})` is `"₱21.67/m"`.
  - `lineTotal(16.5, 3)` is 49.5; `lineTotal(0.1, 3)` is 0.3.
- [x] **Step 2: Implement** with `Intl` and `timeZone: "Asia/Manila"`.
- [x] **Step 3: Commit** `feat: delivery date, fee and quantity rules`.

### Task 4: Listing engine

**Files:** Create `src/lib/catalog/listing.ts`, `listing.test.ts`.

**Interfaces:**
- `SortKey = "relevance" | "best" | "price-asc" | "price-desc" | "rating" | "new"`
- `ListingParams { sub?, sort, show, filters: Record<string, string[]> }`
- `parseListingParams(raw, { defaultSort }): ListingParams`
- `queryProducts(products, scope, params): ListingResult`. Scope: `{ categorySlug?, sellerSlug?, dealsOnly?, slugs? }`. `slugs` restricts and orders results, for search.
- `ListingResult { items: CardData[], total, hasMore, facets: Facet[], applied: { key, value, label }[] }`
- `Facet { key, label, values: { value, label, count, selected }[] }`
- `listingHref(pathname, params, change): string`
- Filter order: category-specific, Price, Delivery, Seller, Brand, Rating, In stock. Price buckets: under ₱250, ₱250–500, ₱500–1,000, ₱1,000–5,000, over ₱5,000. Delivery: same or next day (`leadDays` up to 1), within 3 days. Rating: 4 and up, 4.5 and up. Batch size: 12.

- [x] **Step 1: Tests.**
  - `"values in one filter are OR, filters together are AND"`
  - `"a facet's counts ignore its own filter but respect the others"`
  - `"filtering on a size returns that size on the card"`
  - `"a seller scope shows that seller's offer"`
  - `"each sort orders correctly and ties keep catalog order"`
  - `"show defaults to 12, ignores abc, and hasMore is false on the last batch"`
  - `"price buckets with no products are left out"`
  - `"unknown params and values are ignored"`
  - `"listingHref toggles a value and resets show"`
  - `"zero results still returns the applied filters so they can be removed"`
- [x] **Step 2: Implement** as pure functions.
- [x] **Step 3: Commit** `feat: product listing engine`.

### Task 5: Cards, categories and all-products listing

**Files:**
- Create: `src/app/(store)/products/page.tsx`, `src/app/(store)/categories/page.tsx`, `src/app/(store)/categories/[slug]/page.tsx`
- Create: `src/components/listing/` with `listing.tsx`, `filter-panel.tsx`, `filter-drawer.tsx`, `applied-filters.tsx`, `sort-select.tsx`, `show-more.tsx`, `sub-pills.tsx`, `empty-results.tsx`, `listing-skeleton.tsx`, `listing.css`, plus tests
- Create: `src/components/home/delivery-line.tsx`
- Modify: `product-card.tsx`, `category-menu.tsx`, `mobile-menu.tsx`, `product-sections.tsx`

**Interfaces:**
- Consumes: Task 2 `CardData`, Task 3 `arrivalDate`, Task 4 `queryProducts`
- `<Listing scope rawParams defaultSort />` is an async server component, always rendered inside `<Suspense fallback={<ListingSkeleton />}>`
- The `ProductCard` component now takes a `CardData` prop. `DeliveryLine({ leadDays })` is a client component showing a date after mount with its height reserved.

- [x] **Step 1: Tests.**
  - `"card shows spec, unit price and links with the chosen size"`
  - `"ticking a filter replaces the URL without scrolling"` asserts `router.replace` with `?diameter=16+mm` and `{ scroll: false }`
  - `"an option with count 0 is disabled unless selected"`
  - `"each chip removes one filter; Clear all removes all"`
  - `"Show more adds 12 to show in the URL"`
  - `"empty results offer to remove each applied filter"`
  - `"the mega menu links a subcategory to ?sub="`
- [x] **Step 2: Implement.** Static shell: breadcrumb, title, picture pills. Results read `searchParams` behind Suspense. Changes run in `startTransition` with the old list dimmed. `generateStaticParams` returns all category slugs; an unknown slug calls `notFound()`. Phones get rows and a Filter button that sticks under the header, opening a drawer built like `CartDrawer`. Change the home "View all" links to `/products?sort=new` and `/products?sort=best`.
- [x] **Step 3: Check in the browser.** Filter a list, press Show more, scroll, open a product, press Back: filters, depth and scroll position are all intact. Repeat on a phone viewport. No sideways scroll at 1440, 768, 390 and 360 px.
- [x] **Step 4: Commit** `feat: category and product listings with filters`.

### Task 6: Search and deals

**Files:**
- Modify: `src/lib/catalog/search.ts`, `src/components/home/search-box.tsx`, `store-shell.tsx`, `site-header.tsx`
- Create: `src/lib/catalog/synonyms.ts`, `src/lib/catalog/search.test.ts` (extend existing tests), `src/app/(store)/search/page.tsx`, `src/app/(store)/deals/page.tsx`, `src/components/listing/no-results.tsx`

**Interfaces:**
- `SearchEntry { slug, name, spec, image, price, unit, words }`
- `getSearchIndex(): Promise<SearchEntry[]>`, added to `src/lib/catalog/index.ts`
- `searchProducts(index, query, limit?): { items: SearchEntry[], fuzzy: boolean, variantBySlug: Record<string, string> }`
- `alternativeQueries(index, query): { query: string, items: SearchEntry[] }[]`
- `StoreShell` passes `await getSearchIndex()` down to `SearchBox`, so client bundles carry only the slim index.

- [x] **Step 1: Tests.**
  - `semento` finds Portland Cement, `chb` Hollow Block, `yero` GI Roofing, `bakal` Rebar, `buhangin` Washed Sand, `graba` Crushed Gravel, `kahoy` Lumber, `pintura` Paint.
  - `portlnd cement` and `rebbar` match with `fuzzy` true.
  - `gi` is never fuzzy-matched, because words under 4 letters must match exactly.
  - `rebar 16mm` selects the 16 mm variant.
  - A name match ranks above a category match.
  - A blank query returns nothing.
  - `alternativeQueries` on `blue rebar` offers `rebar` with products.
  - The no-results page shows related categories, alternatives, popular products and a help link.
- [x] **Step 2: Implement.** Search results reuse `Listing` with a `slugs` scope and `relevance` sort. Fuzzy results carry the notice "No exact matches. Showing close results." `/deals` lists discounted products under the existing dated deal and countdown. `/search` is `noindex`.
- [x] **Step 3: Commit** `feat: search results, local words and deals`.

### Task 7: Product page

**Files:**
- Create: `src/app/(store)/products/[slug]/page.tsx`
- Create: `src/components/product/` with `gallery.tsx`, `buy-box.tsx`, `offer-list.tsx`, `size-picker.tsx`, `quantity-input.tsx`, `cost-summary.tsx`, `spec-table.tsx`, `reviews.tsx`, `often-bought.tsx`, `mobile-buy-bar.tsx`, `product.css`, plus tests

**Interfaces:**
- Consumes: Task 3 rules. Produces `QuantityInput({ value, rules, onChange, name })`, reused by the cart.
- `BuyBox({ product, sellers, initialSize })` is a client component. Size is read from `?size=` behind Suspense so the rest of the page stays in the static shell.

- [x] **Step 1: Tests** (`buy-box.test.tsx`).
  - `"starts on the cheapest in-stock offer"`
  - `"picking another seller updates price, date and the added line"`
  - `"size buttons switch offers; ?size=16-mm starts there; an unknown size falls back"`
  - `"typing 500 and adding puts 500 in the cart at the tier price"`
  - `"below minimum snaps up and says why"`
  - `"above stock caps and says how many are left"`
  - `"a sold-out seller row is disabled; all sold out disables Add and leaves Save"`
  - `"cost summary shows items, delivery to the area and the gap to free delivery"`
  - `"changing the area updates the fee and date"`
  - Page: `"an unknown slug is not found"`, `"generateStaticParams returns every product"`
- [x] **Step 2: Implement.** Native radios for sizes and sellers. The product name is the page `h1`. JSON-LD per `02-guides/json-ld.md`. The sticky phone bar hides `MobileCartBar` while shown. Seller names link to `/sellers/[slug]`. Rating bars appear only when data exists.
- [x] **Step 3: Check in the browser** at all four widths: keyboard through sizes and sellers; type a bulk quantity on the phone viewport.
- [x] **Step 4: Commit** `feat: product page with seller comparison`.

### Task 8: Cart

**Files:**
- Modify: `src/stores/cart-store.ts`, `cart-store.test.ts`, `src/components/home/cart-drawer.tsx`, `add-to-cart-button.tsx`
- Create: `src/app/(store)/cart/page.tsx`, `src/components/cart/` with `cart-page.tsx`, `seller-group.tsx`, `order-summary.tsx`, `cart-notices.tsx`, `cart.css`, `src/lib/catalog/reconcile.ts`, plus tests

**Interfaces:**
- Consumes: Task 2 `CartLine`, Task 7 `QuantityInput`
- `cartCount(lines)` counts lines. `cartTotal(lines)` applies tier prices.
- `reconcileCart(lines, products): { lines, notices: { lineId, kind: "price" | "stock" | "gone", ... }[] }`

- [x] **Step 1: Tests.**
  - `"same product, size and seller merge; another seller is a new line"`
  - `"cartCount counts lines, not units"`
  - `"cartTotal uses tier prices at each line's quantity"`
  - `"a changed price updates the line and raises a notice"`
  - `"a gone offer is flagged, kept visible and blocks checkout until removed"`
  - `"the drawer accepts a typed quantity"`
  - `"the cart groups by seller and names the seller setting the date"`
- [x] **Step 2: Implement.** The drawer gains a typed quantity and a "View cart" link. `/cart` matches the wireframe; the page shell is static and lines render after rehydrate. Update existing `home` tests.
- [x] **Step 3: Commit** `feat: full cart with seller groups and price checks`.

### Task 9: Seller pages and saved items

**Files:** Create `src/app/(store)/sellers/[slug]/page.tsx`, `src/app/(store)/saved/page.tsx`, `src/components/listing/saved-grid.tsx`, `src/components/product/seller-header.tsx`, plus tests.

**Interfaces:** Consumes `queryProducts` with `{ sellerSlug }`. `SavedGrid({ cards })` filters server-rendered cards by the saved slugs in `usePreferences`.

- [x] **Step 1: Tests.**
  - `"a seller page shows the seller's own prices"`
  - `"unknown seller is not found"`
  - `"saved shows only saved items and works with no account"`
  - `"the empty state links to categories"`
  - `"Add all to cart adds each item's best offer at its minimum"`
- [x] **Step 2: Implement.**
- [x] **Step 3: Phase 1 check.** `npm run build`. Real-input browser flow: search `semento`, filter, open a product, pick another seller, type a bulk quantity, add, view the cart, go Back through the list. No console errors. Run the design inspector from `design-taste-frontend` on the listing, product and cart pages and fix what it finds.
- [x] **Step 4: Commit** `feat: seller pages and saved items`.

## Phase 2: Checkout, orders and accounts

### Task 10: Catalog into Neon, order tables (needs your OK, see Decision 1)

**Files:**
- Modify: `src/db/schema.ts`, `src/db/seed.ts`, `src/lib/catalog/index.ts`, home sections that read product lists
- Create: `src/db/tx.ts`, `src/lib/catalog/rows.ts`, `rows.test.ts`, a new migration in `drizzle/`

**Interfaces:**
- New tables: `sellers`, `catalog_products`, `variants`, `offers`, `reviews`, `orders`, `order_items`, `order_events`, `sites`. Replaces the unused `products` table from the first task.
- `orders`: `number` unique, `user_id` null for guests, contact and site fields, `truck_access`, `delivery_date`, `delivery_window`, `subtotal_centavos`, `delivery_fee_centavos`, `total_centavos`, `payment_method`, `payment_status`, `payment_ref`, `idempotency_key` unique, `created_at`.
- `order_items`: snapshot of slug, variant, seller, name, unit, image, `unit_price_centavos`, `quantity numeric(10,2)`, `line_total_centavos`.
- `withTransaction(fn)` in `src/db/tx.ts` uses `drizzle-orm/neon-serverless`, because the `neon-http` driver in `src/db/index.ts` throws on transactions.
- `index.ts` keeps its signatures, adding `'use cache'`, `cacheLife("hours")` and `cacheTag("catalog")`.

- [ ] **Step 1: Test.** `"a product read back from rows equals the sample product"`, a pure mapping test.
- [ ] **Step 2: Implement.** Read `03-api-reference/04-functions/cacheTag.md` first. Confirm the old `products` table holds only the first task's seed rows, then generate the migration, review its SQL, and run `npm run db:migrate` and `npm run db:seed` against your Neon database. The seed prints 48 products and 6 sellers.
- [ ] **Step 3: Check.** `npm run build` passes with the DB reachable. All Phase 1 pages render the same. Deployment needs `DATABASE_URL` at build time.
- [ ] **Step 4: Commit** `feat: move catalog to Neon and add order tables`.

### Task 11: Checkout

**Files:**
- Create: `src/app/(checkout)/layout.tsx`, `src/app/(checkout)/checkout/page.tsx`, `src/components/checkout/` with `checkout-form.tsx`, `site-fields.tsx`, `window-picker.tsx`, `payment-options.tsx`, `checkout-summary.tsx`, `checkout.css`
- Create: `src/lib/orders/price-order.ts`, `place-order.ts`, `schema.ts`, `numbers.ts`, `src/lib/payments/index.ts`, `simulated.ts`, plus tests

**Interfaces:**
- `priceOrder(lines, area, products, now): { ok: true, ...totals } | { ok: false, changes }`
- `placeOrder(input): Promise<{ number } | { error } | { changes }>` is a Server Action
- `newOrderNumber(): string` matches `/^MX-[A-Z2-9]{8}$/`, from `crypto`
- `PaymentProvider { start(order): Promise<{ redirectUrl?: string, paid: boolean }> }`

- [x] **Step 1: Tests.**
  - `"priceOrder uses catalog prices, not browser prices"`
  - `"a changed price comes back as changes and nothing is charged"`
  - `"quantity above stock or below minimum is refused"`
  - `"totals are whole centavos"`
  - `"the same idempotency key makes one order"`
  - `"two buyers racing for the last stock cannot both win"`
  - `"accepts 09171234567 and +639171234567, rejects 12345"`
  - `"a date before the earliest arrival is refused"`
  - `"order numbers are not sequential"`
  - `"an empty cart redirects to /cart"`
- [x] **Step 2: Implement.** Order and stock changes run inside `withTransaction`. Place order disables while pending and reuses one key per attempt. The form draft stays in `sessionStorage`, never payment details. The simulated provider shows "Test payment, no money moves". One charge per order, never one per seller. Update the trust strip to match the real payment list.
- [x] **Step 3: Check in the browser.** Double-click Place order under throttled network: one order row. Change a catalog price mid-checkout: a notice appears and no order is made.
- [x] **Step 4: Commit** `feat: enclosed checkout and order placement`.

### Task 12: Order page and tracking

**Files:**
- Create: `src/app/(store)/orders/[number]/page.tsx`, `src/app/(store)/track/page.tsx`, `src/components/orders/` with `order-tracker.tsx`, `order-history.tsx`, `order-contents.tsx`, `track-form.tsx`, `src/lib/orders/tracking.ts`, `access.ts`, plus tests

**Interfaces:**
- `trackingView(order, events, now): { arrival, stages, sellersConfirmed, carrier, history, proof? }`
- `lookupOrder(number, mobile)` is a Server Action. On a match it sets a signed, httpOnly cookie for that order and redirects. `placeOrder` sets the same cookie, so the buyer can reopen a new order.
- `canViewOrder(order, session, cookies): boolean`
- With `ORDER_TIMELINE=demo`, `demoEvents(order, now)` advances progress by time since placing. Unset, only stored events show.

- [x] **Step 1: Tests.**
  - `"the view has arrival, progress, carrier, reference, history and contents"`
  - `"stages include sellers confirming with a count, before dispatch"`
  - `"demo events appear only with ORDER_TIMELINE=demo"`
  - `"wrong mobile and unknown number give the same message"`
  - `"an order page without proof shows the lookup form and no order details"`
  - `"the buyer who placed the order can reopen it after a refresh"`
- [x] **Step 2: Implement.** Session and cookie reads sit behind Suspense. The confirmation view shows the number prominently and asks the buyer to keep it, since no email goes out.
- [x] **Step 3: Commit** `feat: order tracking and lookup`.

### Task 13: Accounts

**Files:**
- Modify: `.env.local` (generate `BETTER_AUTH_SECRET`, never print it), `src/lib/auth.ts` if needed
- Create: `src/app/(store)/account/page.tsx`, `src/components/account/` with `auth-forms.tsx`, `order-list.tsx`, `saved-sites.tsx`, `create-account-offer.tsx`, `account.css`, `src/lib/orders/buy-again.ts`, plus tests

**Interfaces:**
- `getCurrentUser()` per `02-guides/authentication-with-cache-components.md`, using `'use cache: private'`
- `buyAgain(order, products): { lines, unavailable }`
- `claimOrder(number)` attaches only an order this browser has proof for

- [x] **Step 1: Tests.**
  - `"buy again uses today's prices and lists what is unavailable"`
  - `"claiming needs the order's proof cookie, not just a matching name"`
  - `"wrong password shows a plain message"`
  - `"saved sites prefill checkout"`
  - `"another user's order is not visible"`
- [x] **Step 2: Implement.** `/account` shows sign-in or sign-up with no session, order list and saved sites with one. The confirmation page offers "Save this order to a new account". Checkout links to sign-in but never requires it.
- [x] **Step 3: Phase 2 check.** `npm run build`. Browser flow with a test account you can delete: guest order, track by number and mobile, create the account from the confirmation page, see the order listed, buy again.
- [x] **Step 4: Commit** `feat: accounts, order history and buy again`.

### Task 14: PayMongo test mode (only after you add test keys)

**Files:** Create `src/lib/payments/paymongo.ts`, `src/app/api/payments/webhook/route.ts`, plus tests. Modify `src/lib/payments/index.ts`, `.env.example`.

**Interfaces:** Selects `paymongo` when `PAYMONGO_SECRET_KEY` is set. Without `PAYMENTS_LIVE=true`, it refuses any key not starting with `sk_test_`.

- [ ] **Step 1: Read PayMongo's current docs** and confirm the checkout and webhook calls.
- [ ] **Step 2: Tests.**
  - `"a live key is refused without PAYMENTS_LIVE"`
  - `"a bad webhook signature gets 400 and changes nothing"`
  - `"a paid event marks the order paid once, even if sent twice"`
  - `"a failed payment leaves the order unpaid and offers retry"`
  - `"QR Ph is not offered"`
- [ ] **Step 3: Implement.** Offer GCash, Maya, card and online banking only.
- [ ] **Step 4: Commit** `feat: PayMongo test payments`.

## Phase 3: Help and selling

### Task 15: Help and seller pages

**Files:**
- Create: `src/app/(store)/sell/page.tsx`, `sell/how-it-works/page.tsx`, `sell/support/page.tsx`, `help/delivery/page.tsx`, `help/returns/page.tsx`, `help/contact/page.tsx`
- Create: `src/components/info/` with `info-page.tsx`, `seller-form.tsx`, `info.css`, `src/lib/catalog/info-content.ts`, `src/lib/sellers/apply.ts`, plus tests
- Modify: `src/db/schema.ts` (`seller_applications`)

**Interfaces:** `submitSellerApplication(input)` is a Server Action that validates and stores one row.

- [x] **Step 1: Tests.**
  - `"a valid application stores one row and thanks the applicant"`
  - `"a bad mobile is refused with a field message"`
  - `"delivery help shows the same fees and cut-off as the rules"`, importing from `delivery.ts` so the two can't drift
- [x] **Step 2: Implement.** Static pages sharing one template. Policies are drafts for your client to approve. Contact details are obvious placeholders, never a real person's number.
- [x] **Step 3: Commit** `feat: help and seller pages`.

### Task 16: Remove the placeholder and check every link

**Files:** Delete `src/app/(store)/[...placeholder]/`. Create `scripts/check-links.mjs`. Modify `package.json` (`check:links`), `src/components/story/story.tsx` only if a link broke.

- [x] **Step 1: Delete the placeholder.** Unknown URLs now reach the real 404.
- [x] **Step 2: Write the crawler.** Starting from `/` on a production build, follow every internal link and fail on any non-200 response. Query-string variants of a page are checked once per filter key.
- [x] **Step 3: Final check.** `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run build`, `npm run check:links`, full browser flows at four widths, design inspector on every new page type. Have one fresh reviewer check the whole branch and fix what it confirms.
- [x] **Step 4: Commit** `chore: remove placeholder route and add link check`.

## Sample data to replace before launch

- Sellers, brands, prices, stock, tiers, ratings and sales ranks
- **Reviews.** Delete `data/reviews.ts`; invented reviews must not go live
- AI-generated images
- Delivery fees, areas, cut-off and windows, confirmed by the client
- Returns, delivery and seller policies, plus contact details
- `ORDER_TIMELINE=demo` removed, so buyers never see invented progress
- Simulated payment replaced by PayMongo live keys, set in the hosting environment
- `BETTER_AUTH_SECRET` set separately in production
- Email and SMS added before promising any message

## Sources

- Baymard: [PLP guide](https://baymard.com/blog/product-listing-page-plp-ux), [Product List UX 2025](https://baymard.com/blog/current-state-product-list-and-filtering), [list item information](https://baymard.com/research-articles/product-listing-information), [applied filters](https://baymard.com/research-articles/how-to-design-applied-filters), [Product Page UX 2026](https://baymard.com/blog/current-state-ecommerce-product-page-ux), [cart abandonment](https://baymard.com/blog/reduce-cart-abandonment), [checkout benchmark](https://baymard.com/blog/ecommerce-checkout-usability-report-and-benchmark), [no-results page](https://baymard.com/blog/no-results-page), [order tracking](https://baymard.com/research-articles/integrate-tracking-info), [B2B components](https://baymard.com/blog/b2b-electronic-components-machinery-launch)
- Marketplace: [Sharetribe multi-vendor cart](https://www.sharetribe.com/academy/multivendor-shopping-cart/), [Friedler et al. on the buy box](https://aritang.github.io/files/Friedler_et_al_PriceStabilityPresentation-WWW.pdf)
- Philippines: [Unbox on GCash](https://unbox.ph/news/gcash-ecommerce-2026/), [Shuttle payment methods](https://www.shuttleglobal.com/blog/the-most-popular-payment-methods-in-the-philippines/), [PayMongo testing](https://developers.paymongo.com/docs/payment-acceptance-testing), [PayMongo fee comparison](https://www.paymongo.com/blog/maya-vs-gcash-vs-paymongo-for-business), [Wilcon delivery terms](https://shop.wilcon.com.ph/pick-up-delivery)
- Live pages: [Lowe's](https://www.lowes.com/pl/power-tools/saws/band-saws/4294607760), [Amazon listing](https://www.amazon.com/s?k=hammer+drill), [Amazon product](https://www.amazon.com/DEWALT-Brushless-Cordless-Hammer-DCD806B/dp/B0F8P55L5D), [IKEA PH](https://www.ikea.com/ph/en/cat/desks-computer-desks-20649/), [Grainger](https://www.grainger.com/category/safety/head-protection/hard-hats-safety-helmets/ansi-type-1-vertical-impact-hard-hats-safety-helmets), [Wilcon listing](https://shop.wilcon.com.ph/products/building-materials/lumbers.html)
