import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontFaces, fontPreloads } from "./fonts";
import { asset } from "@/lib/asset";
import { site } from "@/data/site";
import { MotionProvider } from "@/components/MotionProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Preloader } from "@/components/Preloader";
import { Cursor } from "@/components/Cursor";
import { Environment } from "@/components/Environment";
import { Ambient } from "@/components/Ambient";

const title = "DARK MODE | Сайты, которые запоминают";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: "%s | DARK MODE" },
  description: site.description,
  applicationName: "DARK MODE",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: "/",
    siteName: "DARK MODE",
    title,
    description: site.description,
    images: [{ url: asset("/images/og.jpg"), width: 1200, height: 630, alt: "DARK MODE: логотип и затмение над мокрым камнем" }],
  },
  twitter: { card: "summary_large_image", title, description: site.description, images: [asset("/images/og.jpg")] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {fontPreloads.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
        ))}
        <style dangerouslySetInnerHTML={{ __html: fontFaces }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        <MotionProvider>
          <Environment />
          <Ambient />
          <Preloader />
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <Cursor />
        </MotionProvider>
      </body>
    </html>
  );
}
