import Image from "next/image";
import Link from "next/link";
import { flashDeal } from "@/lib/catalog/home-content";
import { Countdown } from "./countdown";
import { ArrowIcon } from "./icons";

export function PromoPanels() {
  return (
    <section className="hm-frame hm-section" aria-label="Deals and selling">
      <div className="hm-promos" data-reveal>
        <div className="hm-promo hm-promo--deal">
          <Image className="hm-promo-cut" src="/home/promos/rebar.webp" alt="" width={900} height={900} sizes="(max-width: 899px) 60vw, 360px" />
          <h2 className="hm-promo-title">{flashDeal.title}</h2>
          <p>{flashDeal.blurb}</p>
          <Countdown endsAt={flashDeal.endsAt} href={flashDeal.href} />
        </div>

        <div className="hm-promo hm-promo--sell">
          <Image className="hm-promo-photo" src="/home/promos/sell.webp" alt="" fill sizes="(max-width: 899px) 100vw, 640px" />
          <h2 className="hm-promo-title">Sell on MatExpress</h2>
          <p>List your stock and reach contractors and architects building near your store. We handle the delivery.</p>
          <Link href="/sell" className="hm-btn hm-btn--accent">
            Become a seller <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
