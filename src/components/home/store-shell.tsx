import { AnnouncementBar } from "./announcement-bar";
import { MobileCartBar } from "./mobile-cart-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StoreHydrator } from "./store-hydrator";
import { StoreScroll } from "./store-scroll";
import "./home.css";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hm">
      <StoreHydrator />
      <StoreScroll />
      <AnnouncementBar />
      <SiteHeader />
      <main className="hm-main">{children}</main>
      <SiteFooter />
      <MobileCartBar />
    </div>
  );
}
