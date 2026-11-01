import type { Metadata } from "next";
import { DemoNotice } from "@/components/demo-notice";
import { jakarta } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: "MatExpress: Construction materials from trusted suppliers, delivered to site",
  description:
    "Compare cement, steel, sand and lumber from verified hardware stores, check out once, and track every delivery to your site.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="hm-skip">
          Skip to content
        </a>
        <DemoNotice />
        {children}
      </body>
    </html>
  );
}
