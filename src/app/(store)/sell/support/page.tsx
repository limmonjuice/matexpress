import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, SELL_NAV } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Seller support | MatExpress",
  description: "Answers for hardware stores selling on MatExpress.",
};

// Draft answers for the client to confirm before launch.
const QUESTIONS = [
  {
    q: "What does it cost to list?",
    a: "Listing is free. MatExpress takes a commission on what you sell, agreed with you when we visit your store.",
  },
  {
    q: "Do I need my own delivery truck?",
    a: "No. Our trucks collect from your store. You only need to have the order packed and counted by your ready date.",
  },
  {
    q: "Who sets the prices?",
    a: "You do, including lower prices at higher quantities. Buyers see your best price for the amount they're buying.",
  },
  {
    q: "What if I run out of something?",
    a: "Keep your stock up to date and you won't get orders you can't fill. If an order slips through, tell us right away so we can offer the buyer another seller.",
  },
  {
    q: "When do I get paid?",
    a: "After the buyer signs for the delivery. Your share goes to the account you gave us.",
  },
  {
    q: "What about damaged goods?",
    a: "If it left your store damaged, we replace it from your stock. If it was damaged on our truck, that's on us.",
  },
];

export default function SellerSupport() {
  return (
    <InfoPage
      title="Seller support"
      lead="Straight answers for hardware stores. For anything else, call us."
      crumbs={[{ label: "Home", href: "/" }, { label: "Sell on MatExpress", href: "/sell" }, { label: "Seller support" }]}
      nav={SELL_NAV}
      current="/sell/support"
    >
      <div className="hm-prose">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <h2>Still have a question?</h2>
        <p>
          <Link href="/help/contact">Contact us</Link> from 6 AM to 6 PM, every day, or <Link href="/sell#apply">apply</Link> and ask when we visit.
        </p>
      </div>
    </InfoPage>
  );
}
