import Image from "next/image";
import Link from "next/link";
import { heroProducts } from "@/lib/catalog/home-content";
import { formatPeso } from "@/lib/format";
import { ArrowIcon } from "./icons";

const SELLER_INITIALS = ["DH", "TS", "BA"];

export function Hero() {
  return (
    <section className="hm-frame hm-hero-wrap">
      <div className="hm-hero">
        <div className="hm-hero-copy">
          <h1 className="hm-hero-title">
            <span className="hm-line">
              <span>The right materials.</span>
            </span>
            <span className="hm-line">
              <span>Right on schedule.</span>
            </span>
          </h1>
          <p className="hm-hero-sub">
            Source quality construction materials from trusted suppliers and get them delivered to your project site.
          </p>
          <div className="hm-hero-actions">
            <Link href="/categories" className="hm-btn hm-btn--accent">
              Explore materials <ArrowIcon />
            </Link>
            <Link href="/how-it-works" prefetch={false} className="hm-btn hm-btn--ghost">
              How it works
            </Link>
          </div>
          <div className="hm-hero-proof">
            <span className="hm-avatars" aria-hidden="true">
              {SELLER_INITIALS.map((initials) => (
                <i key={initials}>{initials}</i>
              ))}
            </span>
            Verified hardware stores near your site
          </div>
        </div>

        <div className="hm-hero-figure">
          <div className="hm-arch hm-arch--back" />
          <div className="hm-arch" />
          <Image
            className="hm-hero-person"
            src="/home/hero-contractor.webp"
            alt="Site engineer in a white hard hat holding a tablet and rolled blueprints"
            width={876}
            height={1400}
            sizes="(max-width: 699px) 300px, 420px"
            preload
          />

          {heroProducts.map((product, i) => (
            <div key={product.slug} className={`hm-float hm-float--${i + 1}`}>
              <Link href={`/products/${product.slug}`} className="hm-float-card">
                <Image src={product.image} alt="" width={64} height={64} />
                <span>
                  <b>{product.name}</b>
                  <small>
                    {formatPeso(product.priceFrom)} / {product.unit}
                  </small>
                </span>
              </Link>
            </div>
          ))}

          <p className="hm-live">
            <b>Arriving 10:40 AM</b>
            <span>Truck MX-204</span>
          </p>
        </div>
      </div>
    </section>
  );
}
