import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ErrorBeacon } from "@/components/error-beacon";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://frontcanvas.com";
// 上线前三环境全站 noindex；正式上线时把 NEXT_PUBLIC_INDEXABLE 置 1
const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "1";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "FrontCanvas — Restaurant websites worth walking into",
    template: "%s · FrontCanvas",
  },
  description:
    "We redesign restaurant websites so they finally look as good as the food. See a free concept built for your restaurant before you pay anything.",
  applicationName: "FrontCanvas",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "FrontCanvas",
    url: SITE,
    title: "FrontCanvas — Restaurant websites worth walking into",
    description:
      "We redesign restaurant websites so they finally look as good as the food. See a free concept built for your restaurant before you pay anything.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FrontCanvas — Restaurant websites worth walking into",
    description: "We redesign restaurant websites so they finally look as good as the food.",
  },
  robots: INDEXABLE
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a09" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#c2410c",
          borderRadius: "0.9rem",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        },
      }}
    >
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_FLOWGLANCE_SNIPPET_SRC && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script defer src={process.env.NEXT_PUBLIC_FLOWGLANCE_SNIPPET_SRC} data-site={process.env.NEXT_PUBLIC_FLOWGLANCE_SITE_ID} />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <CookieConsent />
        <ErrorBeacon />
      </body>
    </html>
    </ClerkProvider>
  );
}
