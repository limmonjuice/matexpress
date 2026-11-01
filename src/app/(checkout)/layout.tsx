import Link from "next/link";
import { PerkIcon } from "@/components/home/icons";
import { StoreHydrator } from "@/components/home/store-hydrator";
import "@/components/home/home.css";
import "@/components/checkout/checkout.css";

/** No site navigation here: one way forward, and one clearly marked way back. */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hm">
      <StoreHydrator />
      <header className="hm-co-head">
        <div className="hm-frame hm-co-head-row">
          <Link href="/" className="hm-wordmark">
            MatExpress
          </Link>
          <span className="hm-co-secure">
            <PerkIcon name="lock" />
            Secure <span>checkout</span>
          </span>
          <Link href="/cart" className="hm-link">
            Back to cart
          </Link>
        </div>
      </header>
      <main id="main" className="hm-main">
        {children}
      </main>
      <footer className="hm-frame hm-co-foot">
        Need a hand? We&apos;re here 6 AM to 6 PM, every day. <Link href="/help/contact">Contact us</Link>
      </footer>
    </div>
  );
}
