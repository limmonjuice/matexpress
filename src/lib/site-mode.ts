/**
 * A public demo: sample sellers, prices and reviews, a notice saying so on every page, no search engines, and
 * buttons on the order page that do the sellers' and driver's part. Unset, the site is the real store.
 * `next.config.ts` reads the same setting for the search engine header, and the build fixes what's on prerendered pages.
 */
export const isDemoSite = () => process.env.SITE_MODE === "demo";
