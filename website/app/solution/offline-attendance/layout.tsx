import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline Biometric Attendance System (2026 Guide) · TimeLogic",
  description:
    "Deploy biometric facial recognition attendance that works 100% offline. Zero dependency on continuous internet. Automatically synchronizes attendance logs when reconnected.",
  keywords: [
    "offline biometric attendance",
    "offline attendance tracking system",
    "attendance tracker without internet",
    "low bandwidth attendance kiosk",
    "attendance system for remote sites",
    "TimeLogic offline attendance",
    "construction attendance tracker",
  ],
  alternates: {
    canonical: "/solution/offline-attendance",
  },
  openGraph: {
    title: "Offline Biometric Attendance System · TimeLogic",
    description:
      "Sub-second on-device facial recognition that operates completely offline. Encrypted local caching with seamless cloud delta sync.",
    url: "https://www.timelogics.tech/solution/offline-attendance",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offline Biometric Attendance System · TimeLogic",
    description:
      "Zero internet required for daily staff clock-in. Built for warehouses, remote sites, and high-disruption environments.",
  },
};

export default function OfflineAttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
