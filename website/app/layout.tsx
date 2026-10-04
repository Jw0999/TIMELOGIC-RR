import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const TITLE = "TimeLogic — #1 Biometric Attendance & Workforce System";
const DESCRIPTION =
  "TimeLogic verifies every workforce check-in by physical kiosk hardware, facial biometrics, and authorized time. Secure, real-time attendance for offices, schools, clinics, factories, and multi-branch teams.";
const SITE_URL = "https://www.timelogics.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · TimeLogic",
  },
  description: DESCRIPTION,
  applicationName: "TimeLogic",
  keywords: [
    "attendance",
    "attendance management system",
    "biometric attendance software",
    "employee attendance tracker",
    "facial recognition attendance",
    "anti buddy punching",
    "time and attendance system",
    "kiosk attendance station",
    "workforce attendance software",
    "TimeLogic",
    "Time Logic",
    "offline attendance tracker",
  ],
  authors: [{ name: "TimeLogic Technologies" }],
  creator: "TimeLogic Technologies",
  publisher: "TimeLogic Technologies",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TimeLogic",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/logo-transparent.png",
        width: 1200,
        height: 630,
        alt: "TimeLogic Biometric Attendance Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@TimeLogicTech",
    images: ["/logo-transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#090A0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TimeLogic",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-mark-cyan.png`,
      email: "hr@timelogics.tech",
      sameAs: [
        "https://www.linkedin.com/company/timelogic",
        "https://twitter.com/TimeLogicTech",
        "https://github.com/Jw0999/TIMELOGIC-RR",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "TimeLogic Workforce Attendance System",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Windows, Linux, Android",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "148",
      },
      description: DESCRIPTION,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#090A0F] text-slate-100 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
