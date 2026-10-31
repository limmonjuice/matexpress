import type { FlashDeal, Perk } from "./types";

// Static sample content for the store's marketing surfaces. No product data here:
// client components import this file, and the catalog shouldn't ship to the browser with it.

export const announcements = [
  "Free delivery on orders over ₱25,000",
  "Same-day dispatch before 2 PM",
  "Verified suppliers only",
];

export const popularSearches = ["Cement", "Rebar", "CHB", "Yero", "Plywood"];

export const services: Perk[] = [
  { icon: "compare", title: "Compare suppliers", text: "Prices and stock, side by side" },
  { icon: "cart", title: "One checkout", text: "One payment, many sellers" },
  { icon: "truck", title: "Delivered to site", text: "Pick your delivery window" },
  { icon: "route", title: "Live tracking", text: "Follow every truck to your gate" },
];

export const trustPoints: Perk[] = [
  { icon: "shield", title: "Verified sellers", text: "Every store is checked before it lists" },
  { icon: "lock", title: "Secure payment", text: "GCash, Maya, card and online banking" },
  { icon: "camera", title: "Proof of delivery", text: "A signed photo with every drop" },
  { icon: "headset", title: "Real support", text: "6 AM to 6 PM, every day" },
];

export const flashDeal: FlashDeal = {
  title: "Steel month",
  blurb: "Up to 15% off rebar and tie wire from verified sellers.",
  endsAt: "2026-11-30T23:59:59+08:00",
  href: "/deals",
  image: "/home/promos/rebar.webp",
};

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "All categories", href: "/categories" },
      { label: "All products", href: "/products" },
      { label: "Deals", href: "/deals" },
      { label: "Saved items", href: "/saved" },
      { label: "Track an order", href: "/track" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Sell on MatExpress", href: "/sell" },
      { label: "How selling works", href: "/sell/how-it-works" },
      { label: "Seller support", href: "/sell/support" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Delivery areas", href: "/help/delivery" },
      { label: "Returns and damage", href: "/help/returns" },
      { label: "Contact us", href: "/help/contact" },
    ],
  },
];
