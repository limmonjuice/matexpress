import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeMotion } from "@/components/home/home-motion";
import { ArrowIcon } from "@/components/home/icons";
import { Breadcrumbs } from "@/components/listing/breadcrumbs";
import { SellerForm } from "@/components/info/seller-form";
import "@/components/checkout/checkout.css";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Sell on MatExpress",
  description: "List your hardware store's stock and reach contractors and architects building near you. We handle the delivery.",
};

const CLAIMS = [
  {
    title: "Buyers already comparing",
    text: "Contractors and architects search here by material, then pick a seller by price and date. If your price is right, they find you without a sales call.",
  },
  {
    title: "No truck needed",
    text: "Our trucks collect from your store and from everyone else in the order. You get it ready. We carry it and handle the delivery.",
  },
  {
    title: "Your prices, your stock",
    text: "Set your own price and your own price breaks at volume. Buyers typing 500 see your best price for 500, so bulk discounts actually win you bulk orders.",
  },
];

export default function SellPage() {
  return (
    <>
      <section className="hm-frame">
        <div className="hm-sellhero">
          <Image className="hm-sellhero-photo" src="/home/promos/sell.webp" alt="" fill sizes="(max-width: 1320px) 100vw, 1320px" preload />
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sell on MatExpress" }]} />
          <h1>Sell to every site nearby</h1>
          <p>List your stock once. Contractors find it, our trucks collect it, and you get paid after delivery.</p>
          <a href="#apply" className="hm-btn hm-btn--accent">
            Apply to sell <ArrowIcon />
          </a>
        </div>
      </section>

      <section className="hm-frame hm-section" aria-label="Why sell here">
        <div className="hm-claims" data-reveal>
          {CLAIMS.map((claim) => (
            <div key={claim.title}>
              <h2>{claim.title}</h2>
              <p>{claim.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hm-frame hm-section hm-applywrap" id="apply" aria-labelledby="hm-apply-title">
        <div>
          <h2 id="hm-apply-title">Put your store on the map</h2>
          <p>Tell us about your store. We&apos;ll call to arrange a visit, because every seller here is checked in person first.</p>
          <p>
            Want the details first? See <Link href="/sell/how-it-works">how selling works</Link> or <Link href="/sell/support">seller support</Link>.
          </p>
        </div>
        <SellerForm />
      </section>
      <HomeMotion />
    </>
  );
}
