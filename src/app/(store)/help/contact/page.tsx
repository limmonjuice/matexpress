import type { Metadata } from "next";
import Link from "next/link";
import { HELP_NAV, InfoPage } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Contact us | MatExpress",
  description: "Reach MatExpress support from 6 AM to 6 PM, every day.",
};

// The number and address are placeholders. Replace them with the real ones before launch.
const PHONE = "(02) 8000 0000";
const EMAIL = "help@matexpress.example";

export default function ContactHelp() {
  return (
    <InfoPage
      title="Contact us"
      lead="We're here from 6 AM to 6 PM, every day, because that's when sites are working."
      crumbs={[{ label: "Home", href: "/" }, { label: "Help" }, { label: "Contact us" }]}
      nav={HELP_NAV}
      current="/help/contact"
    >
      <div className="hm-prose">
        <h2>Talk to a person</h2>
        <ul>
          <li>
            Call <a href={`tel:${PHONE.replace(/\D/g, "")}`}>{PHONE}</a>
          </li>
          <li>
            Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </li>
        </ul>
        <p>Have your order number ready if it&apos;s about an order.</p>

        <h2>Often faster</h2>
        <ul>
          <li>
            <Link href="/track">Track an order</Link> with its number and your mobile.
          </li>
          <li>
            See <Link href="/help/delivery">delivery areas, fees and dates</Link>.
          </li>
          <li>
            See what happens if something arrives <Link href="/help/returns">damaged or wrong</Link>.
          </li>
          <li>
            Own a hardware store? <Link href="/sell">Sell on MatExpress</Link>.
          </li>
        </ul>
      </div>
    </InfoPage>
  );
}
