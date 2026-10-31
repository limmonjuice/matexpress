import Link from "next/link";
import { footerColumns } from "@/lib/catalog/home-content";

const PAYMENTS = ["GCash", "Maya", "Visa", "Mastercard", "Online banking"];

export function SiteFooter() {
  return (
    <footer className="hm-footer">
      <div className="hm-frame">
        <div className="hm-footer-top">
          <div className="hm-footer-brand">
            <Link href="/" className="hm-wordmark">
              MatExpress
            </Link>
            <p>Construction materials from verified hardware stores, delivered to your site.</p>
          </div>
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={link.href === "/how-it-works" ? false : undefined}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="hm-footer-bottom">
          <p>© 2026 MatExpress</p>
          <p>
            We accept <span>{PAYMENTS.join(" · ")}</span>
          </p>
        </div>
      </div>
      <p className="hm-footer-mark" aria-hidden="true">
        MatExpress
      </p>
    </footer>
  );
}
