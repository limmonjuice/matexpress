import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/home/icons";
import { HELP_NAV, InfoPage } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Contact us | MatExpress",
  description: "Reach MatExpress support from 6 AM to 6 PM, every day.",
};

// The number and address are placeholders. Replace them with the real ones before launch.
const PHONE = "(02) 8000 0000";
const EMAIL = "help@matexpress.example";

const FASTER = [
  { href: "/track", title: "Track an order", text: "With its number and your mobile." },
  { href: "/help/delivery", title: "Delivery areas, fees and dates", text: "Worked out for your own area." },
  { href: "/help/returns", title: "Damaged or wrong?", text: "What to do, and how we replace it free." },
  { href: "/sell", title: "Own a hardware store?", text: "Sell on MatExpress." },
];

export default function ContactHelp() {
  return (
    <InfoPage
      title="Contact us"
      image="/home/products/in-use/safety-hard-hat.webp"
      lead="We're here from 6 AM to 6 PM, every day, because that's when sites are working."
      crumbs={[{ label: "Home", href: "/" }, { label: "Contact us" }]}
      nav={HELP_NAV}
      current="/help/contact"
    >
      <div className="hm-prose hm-arrive">
        <h2>Talk to a person</h2>
        <p>Have your order number ready if it&apos;s about an order.</p>
        <div className="hm-contact">
          <a className="hm-contact-way" data-dark="true" href={`tel:${PHONE.replace(/\D/g, "")}`}>
            <b>{PHONE}</b>
            <span>Call us. Fastest when a truck is on its way.</span>
          </a>
          <a className="hm-contact-way" href={`mailto:${EMAIL}`}>
            <b>{EMAIL}</b>
            <span>Email us, with a photo if something arrived damaged.</span>
          </a>
        </div>

        <h2>Often faster</h2>
        <ul className="hm-faster">
          {FASTER.map((way) => (
            <li key={way.href}>
              <Link href={way.href}>
                <b>{way.title}</b>
                <small>{way.text}</small>
                <ArrowIcon />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </InfoPage>
  );
}
