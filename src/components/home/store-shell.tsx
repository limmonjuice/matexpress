import { SmoothScroll } from "@/components/smooth-scroll";
import { getSearchIndex } from "@/lib/catalog";
import { AnnouncementBar } from "./announcement-bar";
import { MobileCartBar } from "./mobile-cart-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StoreHydrator } from "./store-hydrator";
import "./home.css";

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const searchIndex = await getSearchIndex();

  return (
    <div className="hm">
      <StoreHydrator />
      <SmoothScroll />
      <AnnouncementBar />
      <SiteHeader searchIndex={searchIndex} />
      <main className="hm-main">{children}</main>
      <SiteFooter />
      <MobileCartBar />
    </div>
  );
}
