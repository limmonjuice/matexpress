# Security

How MatExpress protects its buyers, what it doesn't do yet, and what has to be true before it goes live. Keep this current: a practice nobody can find is a practice nobody follows.

## Reporting a problem

Contact the repository owner directly, and don't open a public issue. Include what you found and how to reproduce it.

## What's in place

### Accounts and passwords

- **Library:** [Better Auth](https://www.better-auth.com) handles sign-up, sign-in and sessions, in `src/lib/auth.ts`.
- **Storage:** passwords are stored as salted scrypt hashes. They are never logged or sent back.
- **Rules:** 8 to 128 characters. `src/lib/password-rules.ts` also refuses common passwords, including with `@` for `a` or numbers on the end, plus anything only numbers under 12 digits or built on the person's own name or email. There are deliberately no character-mix rules.
- **Wrong login:** the same message whether or not the account exists.
- **Changing a password:** needs the current one, and signs out every other device.
- **Deleting an account:** needs the password. It removes the account, its sessions and its saved sites. Past orders stay on record, unlinked from any account (see "Open questions").

### Sessions

- **Cookie:** `HttpOnly` and `SameSite=Lax`, and `Secure` once `BETTER_AUTH_URL` is `https://`. It lasts 7 days.
- **Sign-out:** ends the session on the server, then does a full page load, because pages kept alive in the background still hold the buyer's details. It also forgets this browser's orders and checkout draft.

### Rate limits

Limits are counted in the database (`src/lib/throttle.ts`, the `throttles` table), so every copy of a hosted server shares them. The sign-in, sign-up, password-change and deletion limits by address only run in production. The rest always run.

| What | Limit | Counted by |
|---|---|---|
| Wrong sign-ins | 3 per 10 seconds | Address |
| Sign-in tries on one account | 10 per 15 minutes, cleared by a right password | Email |
| Sign-ups | 10 per hour | Address |
| Password changes | 3 per 10 seconds | Address |
| Account deletions | 5 per minute | Address |
| Order lookups | 30 per 15 minutes | Address |
| Lookups of one order | 10 per 15 minutes | Order number |
| Placing orders | 20 per 10 minutes | Address |
| Seller applications | 5 per hour | Address |

The per-account limit can be used to keep someone out of their account for a while by failing on purpose. They stay signed in on devices they're already using. That's the accepted trade-off for stopping password guessing from many addresses.

### Orders

- **The server decides:** prices, totals, stock and delivery dates are worked out on the server. Browser prices are only compared with them (`src/lib/orders/price-order.ts`).
- **Server Actions are public endpoints:** each one checks what it's sent and who is asking (`src/lib/orders/actions.ts`, `rules.ts`).
- **Who can open an order:** the account that owns it, or a browser holding a signed cookie proving it placed the order or gave its number and mobile (`src/lib/orders/proof.ts`). A wrong number and a wrong mobile get the same answer.
- **Charging:** an order is saved before any charge, and one key means one order, so a retry can't charge twice.
- **Claiming:** orders join an account only when the buyer asks.
- **Demo controls:** with `SITE_MODE=demo`, the order page can do the sellers' and driver's part. The actions refuse everything with the switch off, and with it on they only work for a browser that could open that order anyway.

### The browser

Security headers are set in `next.config.ts`: a content security policy, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security`.

The content policy allows inline scripts, because Next.js needs them and nonces would force every prerendered page to render per request. So the policy limits what an injected script could load, and React's escaping is what stops scripts being injected. The one place that writes raw HTML is the product page's JSON-LD, which is escaped.

### Secrets

`.env*` is git-ignored, apart from `.env.example`, which holds placeholders only. Secrets go in the hosting provider's settings. If one ever leaks, replace it: changing `BETTER_AUTH_SECRET` signs everyone out and voids every order cookie.

## What isn't built yet

These need an email or SMS provider:

- **Password reset.** Anyone who forgets their password is locked out until this exists.
- **Email verification.** Anyone can sign up with someone else's email, and sign-up reveals which emails have accounts. Better Auth hides that once verification is on.
- **Checking the mobile on an order.** Anyone holding an order's number and mobile can open it, and can add it to their account if no one owns it yet.

Also not built:

- Two-factor sign-in.
- Roles and an admin area. There's no privileged user today, and the seller dashboard will need both.
- A real payment gateway. See Task 14 in the [plan](docs/superpowers/plans/2026-11-01-store-pages.md).

## Before going live

- [ ] `BETTER_AUTH_URL` is the real `https://` address. Cookies only get `Secure` from it, and sign-ins from any other address are refused, including preview deployments.
- [ ] `BETTER_AUTH_SECRET` is new for production, long and random: `openssl rand -base64 32`.
- [ ] `SITE_MODE=demo` is removed, and the site rebuilt. While it's on, every page says it's a demo, search engines are told to stay away, and anyone who can open an order can move it along with the demo controls.
- [ ] The host sends one client address in `X-Forwarded-For` and overwrites whatever the visitor sent. Vercel does. Behind any other proxy, set `advanced.ipAddress.trustedProxies` in `src/lib/auth.ts` and match it in `clientAddress` in `src/lib/orders/actions.ts`. Without a trustworthy address, sign-ins share one limit across all visitors, and the per-address form limits switch off.
- [ ] The site is served only over HTTPS.
- [ ] If a payment gateway is embedded rather than redirected to, add its address to the content policy in `next.config.ts`.
- [ ] A privacy policy and terms are published. The site collects names, mobile numbers and addresses.

## Open questions for the client

- **How long should orders be kept after an account is deleted?** They keep the name, mobile and address for receipts and warranty claims. Confirm this against the Data Privacy Act of 2012 with someone qualified.
- **Should leaked passwords be refused too?** Better Auth's `haveIBeenPwned` plugin checks a far bigger list, but it fails closed: if that service is down, nobody can sign up.

## Working on this code

- Check who's asking and what they sent in every Server Action and API route. The form's own validation protects nothing.
- Never trust a price, total, owner or date that came from the browser.
- Read plain-object lookups with `Object.hasOwn` when the key comes from a person. `"constructor"` exists on every object.
- Send people only to paths checked by `localPath` in `src/lib/orders/rules.ts`.
- Keep private reads inside `Suspense` and out of anything cached.
- `npm audit` runs on every push, for what ships to the live site, and fails on high or critical. The moderate warnings today are all from `drizzle-kit`, a development tool that isn't part of the live site.
