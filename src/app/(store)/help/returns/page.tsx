import type { Metadata } from "next";
import Link from "next/link";
import { HELP_NAV, InfoPage } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Returns and damage | MatExpress",
  description: "What to do when materials arrive damaged, short or wrong, and how returns work on MatExpress.",
};

// Draft terms for the client to confirm before launch.
export default function ReturnsHelp() {
  return (
    <InfoPage
      title="Returns and damage"
      image="/home/products/in-use/portland-cement.webp"
      lead="If it arrives broken, short or wrong, we replace it free. Check the load before you sign."
      crumbs={[{ label: "Home", href: "/" }, { label: "Returns and damage" }]}
      nav={HELP_NAV}
      current="/help/returns"
    >
      <div className="hm-prose hm-arrive">
        <h2>If something is wrong on arrival</h2>
        <ol className="hm-steps">
          <li>
            <div>
              <b>Check it before signing</b>
              <span>Count the load with the driver. Look for torn bags, broken blocks and wet boards.</span>
            </div>
          </li>
          <li>
            <div>
              <b>Tell the driver</b>
              <span>The driver notes it and takes a photo, which goes on your order.</span>
            </div>
          </li>
          <li>
            <div>
              <b>We replace it free</b>
              <span>The right quantity comes on the next run, with no delivery fee.</span>
            </div>
          </li>
        </ol>

        <h2>If you find it after the truck leaves</h2>
        <p>
          <Link href="/help/contact">Contact us</Link> within 48 hours with your order number and a photo. Hidden damage is covered the same way.
        </p>

        <h2>If you ordered too much</h2>
        <ul>
          <li>Unused materials in their original packing can go back within 7 days.</li>
          <li>You get the price of the items back, less the cost of the truck that collects them.</li>
          <li>Sand, gravel and fill can&apos;t be returned once they&apos;re dropped.</li>
          <li>Items cut to your length, like long-span roofing, can&apos;t be returned.</li>
        </ul>

        <h2>How refunds work</h2>
        <p>Refunds go back the way you paid, within 7 working days of the seller receiving the items.</p>
      </div>
    </InfoPage>
  );
}
