import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, SELL_NAV } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "How selling works | MatExpress",
  description: "From your first listing to getting paid: how selling on MatExpress works.",
};

// Draft terms for the client to confirm before launch.
export default function HowSellingWorks() {
  return (
    <InfoPage
      title="How selling works"
      image="/home/categories/masonry.webp"
      lead="You keep the store running. We bring the buyers and the truck."
      crumbs={[{ label: "Home", href: "/" }, { label: "Sell on MatExpress", href: "/sell" }, { label: "How selling works" }]}
      nav={SELL_NAV}
      current="/sell/how-it-works"
    >
      <div className="hm-prose hm-arrive">
        <h2>Getting listed</h2>
        <ol className="hm-steps">
          <li>
            <div>
              <b>Apply</b>
              <span>Tell us your store, your city and what you sell.</span>
            </div>
          </li>
          <li>
            <div>
              <b>We visit</b>
              <span>Every seller is checked in person before anything lists. That&apos;s what the verified mark means.</span>
            </div>
          </li>
          <li>
            <div>
              <b>List your stock</b>
              <span>Your prices, your price breaks at volume, and how soon you can have each item ready.</span>
            </div>
          </li>
        </ol>

        <h2>When an order comes in</h2>
        <ol className="hm-steps">
          <li>
            <div>
              <b>You confirm</b>
              <span>The buyer sees it the moment you do, so they know their materials are held.</span>
            </div>
          </li>
          <li>
            <div>
              <b>You get it ready</b>
              <span>Packed and counted, by the date you promised on your listing.</span>
            </div>
          </li>
          <li>
            <div>
              <b>Our truck collects</b>
              <span>One truck picks up from every seller in the order and delivers it all to site.</span>
            </div>
          </li>
          <li>
            <div>
              <b>You get paid</b>
              <span>Once the buyer has signed for the delivery, your share is paid out to your account.</span>
            </div>
          </li>
        </ol>

        <h2>What makes a seller win</h2>
        <ul>
          <li>A clear price at the quantities contractors really buy. Volume breaks change who ranks first.</li>
          <li>Honest stock. A seller without enough stock drops below those who have it.</li>
          <li>Being ready sooner. The soonest seller is marked on every comparison.</li>
        </ul>
        <p>
          Ready? <Link href="/sell#apply">Apply to sell</Link>.
        </p>
      </div>
    </InfoPage>
  );
}
