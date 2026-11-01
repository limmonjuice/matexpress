# Rendering and data

How each page in MatExpress gets to the screen, how it uses the database, and what changes when the catalog moves into Neon. Read this before adding a page or a query.

## The names, in this version of Next.js

SSG, ISR and SSR are no longer three modes you pick per page. With `cacheComponents` on, one page mixes them.

| Name | What it means | How it's written here |
| --- | --- | --- |
| **SSG** | Built ahead of time, served from a CDN | The default, for anything that reads no cookies, URL values or uncached data |
| **ISR** | Built ahead of time, refreshed later without a deploy | `"use cache"` + `cacheLife("hours")` + `cacheTag(...)`, then `revalidateTag(tag, "max")` when the data changes |
| **SSR** | Rendered for this request | Inside `<Suspense>`, reading `cookies()`, `headers()` or `searchParams`. The rest of the page still comes from the CDN, and this part streams in |
| **CSR** | Rendered in the browser | A client component reading what only the browser has, such as the saved cart |

## What each page uses

| Page | Today | Why |
| --- | --- | --- |
| Help, sell, how it works | SSG | The same for everyone, and written in code |
| Home, categories hub | ISR, refreshed hourly | The same for everyone, built from the database |
| Product | ISR, refreshed hourly, every product built ahead of time | The same for everyone. Size comes from the URL in the browser, and add to cart is CSR |
| Category, all products, deals, seller, job, search | SSG shell, SSR list | Filters are in the URL and effectively unbounded, so they can't all be built ahead of time. Filtered pages stay real URLs that can be shared |
| Saved | SSG shell, CSR list | The list lives in the browser, so nobody needs an account to keep one |
| Cart | SSG shell, CSR contents | The cart lives in the browser, so a cache can never hand one customer's cart to another |
| Checkout | SSG shell, CSR form, prices checked on the server | What the browser says never decides a price. `priceOrder` works it out again when the order is placed |
| Track, order, account | SSG shell, SSR contents, never cached | Personal. These are the only pages that read the database as they render |
| `/api/search-index` | ISR, refreshed hourly | Fetched the first time someone goes to search, instead of inside every page |

## Rules for new code

**Database**

- **A query needs a reason to run.** Check what can be checked without one first, the way `openOrder` does.
- **Queries for one page go in one `db.batch`.** Each `await db.select()` on its own is a trip to the database, and a batch is one trip, however many queries are in it. A trip takes about 50ms from this machine, and over 200ms if the app is on the wrong continent.
- **Every foreign key gets an index, and so does any column a page filters or sorts by.** Postgres doesn't add them for you. Adding one to a large live table needs `CREATE INDEX CONCURRENTLY`, which `drizzle-kit migrate` can't do because it runs in a transaction.
- **Lists have a limit,** and select the columns they show, not `*`.
- **Personal data never goes inside `"use cache"`.** Nothing that depends on who's asking gets cached on the server.
- **Nothing polls from a hidden tab.** Each query wakes the database, and it then stays awake for five minutes.

**Rendering**

- **Links prefetch, and prefetching downloads the page's JavaScript too.** `ensureStatic = "shell"` on the store layout keeps a default `<Link>` from running request-time code. Set `prefetch={false}` on links that are rare, heavy or have nothing to show until they've read a session: `/account` and `/how-it-works`. A link inside a closed drawer counts as visible, so it needs this too.
- **Keep sign-in code out of anything `/track` imports.** The header links to `/track` from every page, so whatever it imports reaches every visitor. That's why `CreateAccountOffer` has its own file.
- **The first screen fetches its photos at once, and nothing else does.** Use `eager` on `ProductCard` and `preload` on a page's one big image.
- **Don't draw what the browser doesn't know yet.** Until a saved cart or list has loaded, show the title and `aria-busy="true"`, not an empty cart. That attribute also hides the footer, so it can't jump.
- **GSAP loads after the page is up.** Don't import it at the top of anything in the store shell. Only the story page, which needs it at once, imports it directly.

## Hosting

- **The app and the database must be in the same region.** Neon is in Singapore (`ap-southeast-1`). Vercel puts new projects in Washington, D.C. by default, so `vercel.json` pins the functions to `sin1`. On any other host, choose Singapore there too.
- **Neon sleeps after five idle minutes, and the free plan can't turn that off.** The first query after sleeping took 1,007ms when measured, against about 50ms once awake. Today that only lands on order and account pages.
- **The free plan is 100 compute-hours a month.** That's about 17 days awake at the smallest size (0.25 CU), which is why a tracking page in a forgotten tab must not keep it awake. It used to, by asking every 20 seconds.

## How the catalog is read

Products, sizes, offers, sellers and reviews live in Neon. Categories and job guides are still in code, because they're the site's navigation. `src/db/sample/` is only input for the seed, and a test stops the store importing it.

- **Setting up a database:** `npm run db:migrate`, then `npm run db:seed`. The seed only fills an empty catalog, and reads everything back to prove it matches. `npm run db:seed -- --reset` replaces prices and stock, so never run it once real sellers are on the site.
- **The build needs `DATABASE_URL` and a seeded database,** because pages are built from it.
- **Pages read through `src/lib/catalog/index.ts`:** `"use cache"`, `cacheLife("hours")` and `cacheTag("catalog")`. There's no admin screen yet, so a price edited directly in the database shows within about an hour, or on the next deploy.
- **Read the catalog before reading the URL.** Read first, it's built into the page ahead of time, and a fresh server served 175 pages with 2 database trips. Read after, hosting that keeps no memory between requests would query on every view.
- **A price shown can be an hour old. A price charged can't.** Checkout reads `liveProducts`, which is never cached.
- **Stock can't go below zero.** Taking stock is in the same batch as saving the order, and a check on `offers` makes the whole batch fail if a seller is short, so the second of two buyers saves nothing and isn't charged. Tested on Neon with the real order code and buyers fired at the same instant: ten buyers for stock enough for three made exactly three orders and three charges, and an order that could only half be filled saved nothing and took nothing.
- **Pages refresh on a sell-out, not on every order,** because rebuilding the store per order costs far more than it's worth.
- **An unpaid order keeps its stock.** Real payments (Task 14) need to release it.
- **Limits to change as the catalog grows:** lists load the whole catalog into one cached entry, `/cart` and `/saved` send every product to the browser, and the search index is 20KB at 48 products. All of that is fine now and won't be at a few thousand products.
- **`use cache` lives in each server instance's memory** and doesn't outlive a deploy. `"use cache: remote"` shares it, but costs a service and only pays off at a high hit rate. Measure first.

## When the database fails

Pages are built from the database, but they don't need it to be served. These were tested on a production build, by switching a running server's database off or making it hang. The tests are in `e2e/database-failure.spec.ts`.

| What the buyer does | Database down | Database hanging |
| --- | --- | --- |
| Browses, searches, filters, opens products | Works, with no delay | Works, with no delay |
| Uses the cart | Works: it lives in the browser | Works |
| Places an order | "We couldn't reach the store", in under a second. The form and cart stay, and trying again can't double the order | The same, after 15 seconds |
| Tracks an order, or applies to sell | The same message. What they typed stays | The same, after 15 seconds |
| Signs in | "Something went wrong. Please try again." The email stays | The same, after 15 seconds |
| Opens an order or their account | The error page, with a working Try again. An order's page still shows its number | The same, after 15 seconds |

- **Every database request gives up after 15 seconds,** in `src/db/index.ts`. The driver has no limit of its own, so without this a hanging database left the page loading for over a minute, and the host would only stop it after minutes. Waking from sleep took about a second when measured.
- **An outage can outlast the cache.** With the clock moved forward and the database still off, every page kept being served at 2 hours and at 25 hours. At 8 days, the home page, search and the search list each failed one request and then served their old copy again. This was on `next start`, not on Vercel. `npm run check:deploy` checks the cache there, but not an outage.
- **Forms built on `useActionState` catch database errors themselves.** Anything thrown replaces the form with the error page and loses what was typed. See `couldNotReachDatabase` in `src/lib/orders/actions.ts`, which also keeps the error in the logs.
- **`global-error.tsx` is the last resort,** for when the root layout itself fails. It brings its own fonts and styles, and a plain link home.
- **The story page's 3D truck fails quietly.** With no WebGL the page reads the same, without the truck. Tested in `e2e/no-webgl.spec.ts`.

## Considered and left out

- **Fully static category pages.** Reading the filters from the URL means each view runs about 50ms on the server, with 0 queries. Making them static would mean sending a whole category to the browser to filter there, which stops working as the catalog grows.
- **Better Auth's session cookie cache.** It would save 2 trips, on only three pages. But a signed-out or revoked session would keep working until the cookie expired, and `SECURITY.md` promises that changing a password signs out other devices.
- **Retrying failed reads.** Neon's first request after sleeping succeeded when tested, and a failed page already shows a working "try again". Writes must never retry blindly.
- **An index on `throttles.window_start`.** That table is written on every login and order, and it stays small because old rows are pruned.
- **The second font file.** The ₱ sign is outside the main character set, so every first visit downloads another 21.5KB. It's cached after that, and `next/font` can't split out one character. Removing it means self-hosting a custom cut of the font.

## Results

Measured on 2026-11-01 against a production build on this machine, before the catalog moved to Neon. The server is local, so server time here is lower than it will be when hosted. Phone figures use a new browser for every run, Chrome's Slow 4G profile (1.6 Mbps, 150ms latency), a processor slowed 4× and a 390×844 screen.

**The database**

| Visit | Before | After |
| --- | --- | --- |
| Browsing the store, signed in or not | 0 queries | 0 queries |
| An order, as a stranger | 3 queries, 3 trips, 136ms | 0 queries, 19ms |
| An order, with its order cookie | 3 queries, 3 trips, 143ms | 3 queries, 1 trip, 79ms |
| An order, signed in | 5 queries, 5 trips, 152ms | 5 queries, 3 trips, 114ms |
| The account page | 4 queries, 4 trips, 182ms | 5 queries, 3 trips, 176ms |
| A tracking page in a hidden tab | 3 trips every 20 seconds, forever | Nothing |
| A tracking page on screen | Every 20 seconds | Every 60 seconds, and at once on coming back |
| Server wake-ups from prefetching, per page view | 2 | 0 |

The account page gains a query only because the third list always runs in the batch, and with no order cookie it asks for nothing.

**The indexes, at 200,000 simulated orders**

| Query | Without | With |
| --- | --- | --- |
| A buyer's orders, newest first | 18.4ms | 0.06ms |
| One order's items | 31.1ms | 0.05ms |
| One order's events | 20.1ms | 0.05ms |
| A buyer's sessions | 2.7ms | 0.05ms |
| The newest 100 of a buyer's 5,000 orders | not measured | 0.07ms, reading the index backwards with no sort |

**What a phone downloads on a first visit, and how much the page jumps**

| Page | HTML | JavaScript | Everything | Layout shift |
| --- | --- | --- | --- | --- |
| Home | 22 → 17KB | 252 → 233KB | 549 → 523KB | 0 → 0 |
| Categories hub | 19 → 13KB | 237 → 221KB | 455 → 427KB | 0 → 0 |
| Category | 30 → 21KB | 248 → 180KB | 449 → 368KB | 0 → 0 |
| Product | 22 → 17KB | 248 → 228KB | 410 → 374KB | 0 → 0 |
| Search | 29 → 20KB | 248 → 179KB | 412 → 323KB | 0 → 0 |
| Saved, empty | 34 → 24KB | 247 → 182KB | 398 → 334KB | 0.091 → 0 |
| Cart | 22 → 17KB | 270 → 218KB | 427 → 360KB | **0.41 → 0** |
| Cart, empty | 22 → 17KB | 251 → 186KB | 400 → 343KB | 0.139 → 0 |
| Checkout | 9 → 5KB | 254 → 204KB | 388 → 323KB | 0.111 → 0 |
| Help | 14 → 9KB | 234 → 169KB | 386 → 306KB | 0 → 0 |
| Help, with a saved cart | 14 → 9KB | 268 → 169KB | 451 → 306KB | 0 → 0 |
| Track | 21 → 12KB | 247 → 180KB | 391 → 316KB | 0 → 0 |
| Account | 22 → 13KB | 245 → 190KB | 380 → 313KB | 0 → 0 |

**Timing on a slow phone**

The old and new builds alternated run by run, so whatever the machine was doing landed on both: five rounds each, and nine for category and product. The middle run is shown, in milliseconds. Bold marks a change bigger than repeat runs of one build differ by, which is about 10%.

| Page | First paint | Largest paint | Blocked time |
| --- | --- | --- | --- |
| Home | 976 → 948 | 1,420 → 1,368 | **466 → 319** |
| Categories hub | 884 → 852 | 1,536 → 1,496 | 295 → 273 |
| Category | 952 → 956 | **1,672 → 1,052** | 316 → 315 |
| Product | 1,004 → 976 | Not proven, see below | 363 → 341 |
| Search | 900 → 912 | 1,528 → 1,476 | **330 → 272** |
| Cart | 824 → 792 | 824 → 2,132, see below | **339 → 279** |
| Checkout | 688 → 712 | 688 → 712 | 138 → 201, see below |
| Help | 864 → 868 | 1,568 → 1,468 | 319 → 280 |
| Track | 796 → 776 | 1,508 → 1,460 | **300 → 225** |

- **First paint didn't change, and that makes sense.** It depends on the HTML and CSS, not on the JavaScript that most of this work removed.
- **Category's largest paint is the one big timing win.** The first photos now start loading as soon as the browser sees them, instead of after layout.
- **Product's largest paint can't be called.** It lands near 1,100ms or near 1,600ms in both builds. The new build landed on the faster one in 6 of 9 runs and the old build in 4 of 9, which isn't enough to claim anything.
- **The cart's later number is the honest one.** 824ms was a ₱0 summary that was about to be replaced. The real cart appears at about 2.1s, inside the 2.5s limit, but it's the slowest page here.
- **Checkout's blocked time rose, though its total work fell.** Its work now runs as fewer, longer tasks, and starts about 200ms sooner. It sits at the target.
- **Most pages are still above the 200ms target.** Most of what's left is React making the page interactive, which no rendering mode removes. Less of it means less client-side code on the page, and the header is the biggest single piece.

Good means largest paint under 2,500ms and layout shift under 0.1. Blocked time stands in for how quickly a page responds to a tap.

## Sources

- Next.js docs in `node_modules/next/dist/docs/01-app/`: `01-getting-started/08-caching.md`, `09-revalidating.md`, `02-guides/optimizing-prefetching.md`, `keeping-pages-static.md`, `incremental-static-regeneration-cache-components.md`, `03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`
- [SSR vs SSG vs ISR vs CSR for ecommerce, Vercel](https://vercel.com/kb/guide/ssr-vs-ssg-vs-isr-vs-csr-for-ecommerce)
- [How to reduce ISR revalidation costs, Vercel](https://vercel.com/kb/guide/how-to-reduce-isr-revalidation-costs)
- [Configuring regions for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [connection latency](https://neon.com/docs/connect/connection-latency), [plans](https://neon.com/docs/introduction/plans)
- [Caching in Hydrogen, Shopify](https://shopify.dev/docs/storefronts/hydrogen/data-fetching/caching)
- [Better Auth session management](https://www.better-auth.com/docs/concepts/session-management)
