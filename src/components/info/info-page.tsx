import Link from "next/link";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import "./info.css";

type Props = {
  title: string;
  lead: string;
  crumbs: { label: string; href?: string }[];
  nav: { label: string; href: string }[];
  current: string;
  children: React.ReactNode;
};

/** Help and seller pages: one template, so nobody has to learn a new layout to find an answer. */
export function InfoPage({ title, lead, crumbs, nav, current, children }: Props) {
  return (
    <div className="hm-frame hm-info">
      <header className="hm-info-head">
        <Breadcrumbs items={crumbs} />
        <h1>{title}</h1>
        <p>{lead}</p>
      </header>
      <div className="hm-info-grid">
        <nav className="hm-info-nav" aria-label="In this section">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hm-info-body">{children}</div>
      </div>
    </div>
  );
}

export const HELP_NAV = [
  { label: "Delivery", href: "/help/delivery" },
  { label: "Returns and damage", href: "/help/returns" },
  { label: "Contact us", href: "/help/contact" },
  { label: "Track an order", href: "/track" },
];

export const SELL_NAV = [
  { label: "Sell on MatExpress", href: "/sell" },
  { label: "How selling works", href: "/sell/how-it-works" },
  { label: "Seller support", href: "/sell/support" },
];
