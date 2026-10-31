import { SmoothScroll } from "@/components/smooth-scroll";
import { AnnouncementBar } from "./announcement-bar";
import { MobileCartBar } from "./mobile-cart-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import "./home.css";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hm">
      <SmoothScroll />
      <AnnouncementBar />
      <SiteHeader />
      <main className="hm-main">{children}</main>
      <SiteFooter />
      <MobileCartBar />
    </div>
  );
}
