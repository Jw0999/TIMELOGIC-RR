import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const TITLE = "TimeLogic — Attendance you can actually trust";
const DESCRIPTION =
  "TimeLogic verifies every workforce check-in by Wi-Fi, registered device, and authorized time. Secure, real-time attendance for offices, schools, clinics, factories, and multi-branch teams.";
const SITE_URL = "https://timelogic.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · TimeLogic",
  },
  description: DESCRIPTION,
  applicationName: "TimeLogic",
  keywords: [
    "attendance software",
    "workforce attendance",
    "employee check-in",
    "Wi-Fi attendance verification",
    "anti-buddy-punching",
    "time and attendance",
    "fraud detection attendance",
    "HR attendance platform",
  ],
  authors: [{ name: "TimeLogic" }],
  creator: "TimeLogic",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TimeLogic",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#060b18",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
