import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stop Buddy Punching & Proxy Attendance (2026 Guide) · TimeLogic",
  description:
    "Eliminate buddy-punching, proxy clock-ins, and payroll inflation permanently. Discover how TimeLogic anchors biometric facial verification to physical on-premise kiosks.",
  keywords: [
    "stop buddy punching",
    "anti buddy punching software",
    "prevent proxy attendance",
    "employee time theft solutions",
    "biometric attendance fraud prevention",
    "TimeLogic anti buddy punching",
    "workforce attendance tracking",
  ],
  alternates: {
    canonical: "/solution/anti-buddy-punching",
  },
  openGraph: {
    title: "Stop Buddy Punching & Proxy Attendance Permanently · TimeLogic",
    description:
      "Recover 2% to 5% of payroll leakage caused by coworker clock-in fraud. Explore TimeLogic's 3-layer anti-buddy punching architecture.",
    url: "https://www.timelogics.tech/solution/anti-buddy-punching",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop Buddy Punching & Proxy Attendance Permanently · TimeLogic",
    description:
      "Hardware-anchored facial verification that completely blocks buddy-punching and mobile GPS spoofing.",
  },
};

export default function AntiBuddyPunchingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
