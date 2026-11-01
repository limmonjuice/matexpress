# Putting the public demo online

The steps for putting MatExpress online as a public demo: sample data, no real money. Real orders need much more, listed at the end.

Only you can do steps 1 to 3, because they need your accounts. Nobody else should hold those passwords or keys.

## 1. Choose where it runs

**Vercel needs a paid plan for this.** Its rules count being paid to build a site as commercial use, including a demo, and its free plan doesn't allow that. Pro is $20 per developer a month, and it has a [free trial](https://vercel.com/docs/plans/hobby#upgrading-to-pro). Decide with your client whose account it goes on, because it should end up theirs.

**The database can stay on Neon's free plan for a demo.** Know its limits: it sleeps after five idle minutes, so the first order page after that takes about a second longer. It has 100 compute-hours a month and restores only 6 hours back. If it runs out, browsing keeps working and orders fail politely: see "When the database fails" in `rendering-and-data.md`.

## 2. Make the production database

Keep the demo apart from development. Otherwise one `npm run db:seed -- --reset` while you're working overwrites every price and stock level on the live site.

1. In [Neon](https://console.neon.tech), create a **new project** called `matexpress-demo`, in **AWS Asia Pacific (Singapore)**. It has to be Singapore: that's where `vercel.json` runs the site.
2. Copy its connection string (Connect → pooled connection).
3. In a terminal in this folder, paste it in place of `your-connection-string`. Use PowerShell:

```powershell
$env:DATABASE_URL="your-connection-string"; npm run db:migrate; npm run db:seed; Remove-Item Env:DATABASE_URL
```

The seed reads everything back and says so if it doesn't match. `.env.local` keeps pointing at development, so your day-to-day work can't touch the demo.

## 3. Put the site on Vercel

1. Merge `store-pages` into `main` and push. Vercel publishes `main`.
2. In [Vercel](https://vercel.com/new), import the GitHub repository. It detects Next.js by itself.
3. Add these under Environment Variables, for **Production**:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | The connection string from step 2 |
| `BETTER_AUTH_SECRET` | A new one, never your development one. Make it with the command below |
| `BETTER_AUTH_URL` | The site's address, like `https://matexpress-demo.vercel.app`. No slash at the end |
| `SITE_MODE` | `demo` |

To make the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Deploy. If the address Vercel gives differs from `BETTER_AUTH_URL`, correct the variable and redeploy, or sign-in will refuse every request.

Preview deployments need the same variables, pointing at your development database. Without them they fail to build, which does no harm to the live site.

## 4. Check it

From the outside, in a terminal:

```bash
npm run check:deploy https://your-address
```

It checks every kind of page, the security headers, that search engines are told to stay away, that the server code runs in Singapore, and that pages come from the cache.

Then by hand, because no test can do these. Use a real iPhone in Safari and a real Android phone in Chrome:

- [ ] The home page, a category, a product and the story page look right and scroll well.
- [ ] Add something to the cart, check out and place an order.
- [ ] On the order page, press through the demo controls to Delivered.
- [ ] Close the browser, open `/track`, and find the order with its number and mobile.
- [ ] Create an account, sign out, sign back in, and delete the account.
- [ ] The demo notice shows at the top of every page.

Delete your test orders afterwards in Neon's SQL editor if you want the demo clean.

## 5. Turn on the automatic tests on GitHub

`.github/workflows/checks.yml` runs on every push. Lint, types and the unit tests work straight away. The browser tests, including Safari's engine, and the database race tests need a database of their own:

1. In Neon, create one more project called `matexpress-test`, in Singapore. Don't use the demo's: these tests reset its catalog.
2. In GitHub, under Settings → Secrets and variables → Actions, add a secret called `TEST_DATABASE_URL` with its connection string.

Until then, those tests are skipped with a notice, and you can run them on your own computer:

```bash
npm run build
```

```bash
npm run test:e2e
```

```bash
npm run test:db
```

They use your development database, and they put back everything they change. Build with `SITE_MODE="demo"` in `.env.local`, as the tests expect a demo.

## When something goes wrong

- **A bad deploy:** in Vercel, open Deployments, pick the last good one, and choose Instant Rollback. It puts the old code back in seconds. It doesn't undo database changes, so add columns and tables rather than renaming or removing them, and remove the old ones in a later release.
- **A database change:** run `npm run db:migrate` against the production database before the deploy that needs it, the same way as in step 2.
- **The database is down:** browsing keeps working from the cache. See "When the database fails" in `rendering-and-data.md`.
- **Lost or broken data:** Neon's free plan can restore to any point in the last 6 hours (Backup & Restore in the console). For the demo you can also just start over: create a new project and repeat step 2.
- **The demo has run out of stock, or looks messy:** run the command from step 2 again, with `npm run db:seed -- --reset` in place of `npm run db:seed`. It puts the sample catalog and stock back. Orders stay.
- **A leaked secret:** replace it in Vercel and redeploy. Changing `BETTER_AUTH_SECRET` signs everyone out and voids every order cookie.
- **Logs:** Vercel keeps them for a day on Pro. Look under Logs, and filter by Error.

## Before real customers

The demo stops being enough the moment real sellers or real money are involved. At least these are still missing:

- A registered business, and real payments. PayMongo's live keys need its identity and business checks.
- A way for sellers and staff to run real orders, including cancellations, refunds and replacements. Today only the demo buttons move an order.
- Seller identity, PS and ICC certificates, invoices and tax handling, for the Internet Transactions Act, DTI and BIR rules. Ask a Philippine lawyer and accountant.
- Password reset, email verification and order messages, which need an email provider.
- Error alerts and longer logs, and paid database plans with longer restore windows, rehearsed.
- Real sellers, prices, stock, photos and contact details, and no invented reviews.
- A privacy policy and terms, a sitemap, and `SITE_MODE` removed.

`SECURITY.md` has the go-live checklist for security.
