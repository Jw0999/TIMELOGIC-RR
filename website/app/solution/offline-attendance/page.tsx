"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  WifiOff,
  Wifi,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  HardHat,
  Warehouse,
  Building2,
  GraduationCap,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  SignalZero,
} from "lucide-react";

const OFFLINE_FAQS = [
  {
    question: "How does TimeLogic verify employee faces without an active internet connection?",
    answer:
      "TimeLogic uses on-device edge computing. When staff are enrolled, an irreversible mathematical vector representing their facial landmarks is securely stored on the local kiosk device. During daily clock-in, the facial matching algorithm executes locally on the tablet or PC processor in under 0.8 seconds without sending data over the internet.",
  },
  {
    question: "How many offline attendance punches can a TimeLogic station store?",
    answer:
      "The local encrypted database (SQLite / IndexedDB) can store over 50,000 attendance punches locally on the device with zero performance degradation. Even if your facility operates completely offline for weeks, all check-in and check-out records are preserved with tamper-proof timestamps.",
  },
  {
    question: "What happens when the internet connection is restored?",
    answer:
      "The TimeLogic station continuously detects network availability in the background. As soon as a connection (Wi-Fi, Ethernet, or mobile phone hotspot) is established, the kiosk silently transmits all cached punches to the central cloud super-admin dashboard in a micro-burst, reconciling the employee attendance logs without duplicates.",
  },
  {
    question: "Does TimeLogic consume high amounts of cellular data when syncing?",
    answer:
      "No. TimeLogic does not upload heavy video or photo files during clock-ins. Each sync record contains only cryptographic attendance tokens and timestamps, consuming less than 500 bytes per punch. An organization with 100 employees uses under 30MB of data for an entire month of attendance syncing.",
  },
];

export default function OfflineAttendancePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: OFFLINE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen w-full bg-[#090A0F] text-white flex flex-col justify-between selection:bg-sky-500/30 selection:text-white">
      {/* Schema.org FAQPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Header />

      <main className="w-full flex-1 pt-12 pb-24 sm:pt-16 sm:pb-32">
        {/* ── 1. HERO SECTION ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-mono font-medium text-cyan-300">
            <WifiOff size={14} className="text-cyan-400" />
            <span>Zero-Downtime Offline Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Biometric Attendance That <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Works 100% Offline
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Broadband outages, power blackouts, or remote job sites? TimeLogic verifies facial biometrics locally on your kiosk hardware with zero internet dependency, auto-syncing to the super-admin dashboard the instant connectivity returns.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-[0.98]"
            >
              <span>View Plans & Pricing</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://wa.me/2349113380364?text=Hello%20TimeLogic%2C%20we%20need%20an%20offline%20biometric%20attendance%20system%20for%20our%20site."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <MessageSquare size={14} className="text-sky-400" />
              <span>Discuss Offline Hardware Setup</span>
            </a>
          </div>
        </div>

        {/* ── 2. THE 4 PILLARS OF OFFLINE RELIABILITY ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-16 sm:mt-24">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for Zero Network Dependency
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              How TimeLogic ensures uninterrupted morning check-in lines even when your entire facility loses internet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Edge Biometric Neural Inference</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Facial matching algorithms run entirely on your kiosk tablet or computer’s local processor. Clock-ins execute in under 0.8 seconds without round-tripping to cloud servers.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sky-400">
                <Database size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Encrypted Local SQLite & IndexedDB Storage</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Stores up to 50,000 attendance records locally with cryptographic tamper seals. If the power or device restarts unexpectedly, zero punch logs are corrupted or lost.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <RefreshCw size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Intelligent Two-Way Delta Sync</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The instant an internet connection is detected, the kiosk automatically synchronizes new punch logs to the cloud in a background burst with zero duplicate records.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Ultra-Low Cellular Bandwidth Consumption</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Punches are condensed into lightweight text payloads under 500 bytes each. A monthly roster of 100 staff uses less than 30MB of mobile data, making it ideal for 3G/4G hotspots.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. ENVIRONMENTS THAT BENEFIT MOST ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-white/[0.02]">
            <div className="max-w-3xl space-y-3 mb-10 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Built for High-Disruption Work Environments
              </h2>
              <p className="text-sm text-slate-300">
                TimeLogic thrives where cloud-only attendance apps frequently fail:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                <HardHat size={22} className="text-amber-400" />
                <h4 className="text-base font-bold text-white">Construction Sites</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Field offices and project trailers with zero fixed-line fiber internet.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                <Warehouse size={22} className="text-sky-400" />
                <h4 className="text-base font-bold text-white">Warehouses & Logistics</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Large metal facilities and basements prone to Wi-Fi dead zones.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                <Building2 size={22} className="text-emerald-400" />
                <h4 className="text-base font-bold text-white">Medical Clinics & Labs</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Healthcare facilities requiring clean, uninterrupted zero-contact check-in.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
                <GraduationCap size={22} className="text-purple-400" />
                <h4 className="text-base font-bold text-white">Educational Campuses</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  High-volume morning punch rushes without clogging campus Wi-Fi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. COMPARISON: OFFLINE KIOSK VS CLOUD-ONLY APPS ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E121B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono text-slate-400 uppercase">
                    <th className="py-4 px-5 sm:px-6">Condition</th>
                    <th className="py-4 px-5 sm:px-6 text-slate-300">Cloud-Only Attendance Apps</th>
                    <th className="py-4 px-5 sm:px-6 text-sky-300 bg-sky-500/[0.04] font-bold">TimeLogic Offline Kiosk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  <tr>
                    <td className="py-4 px-5 sm:px-6 font-semibold text-white">Internet Drops / Blackout</td>
                    <td className="py-4 px-5 sm:px-6 text-slate-300">
                      <div className="flex items-center gap-2">
                        <XCircle size={15} className="text-rose-400 flex-shrink-0" />
                        <span>System freezes, throws 404 or connection error</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 sm:px-6 bg-sky-500/[0.03] text-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold">Normal 0.8s face verification continues unaffected</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 sm:px-6 font-semibold text-white">Morning Queue Punch Speed</td>
                    <td className="py-4 px-5 sm:px-6 text-slate-300">
                      <div className="flex items-center gap-2">
                        <XCircle size={15} className="text-rose-400 flex-shrink-0" />
                        <span>5–15 seconds per worker waiting on cloud API</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 sm:px-6 bg-sky-500/[0.03] text-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold">&lt; 0.8 seconds on-device neural match</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 sm:px-6 font-semibold text-white">Monthly Cellular Data</td>
                    <td className="py-4 px-5 sm:px-6 text-slate-300">
                      <div className="flex items-center gap-2">
                        <XCircle size={15} className="text-rose-400 flex-shrink-0" />
                        <span>Gigabytes of heavy photo/video uploads</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 sm:px-6 bg-sky-500/[0.03] text-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold">&lt; 30MB/month per kiosk terminal</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 5. FAQS ── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Offline Attendance FAQs
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to know about offline reliability and cloud sync.
            </p>
          </div>

          <div className="space-y-3.5">
            {OFFLINE_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "bg-white/[0.04] border-sky-500/40 shadow-sm"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-6 flex items-center justify-between text-left gap-4"
                  >
                    <span className="text-base font-semibold text-white tracking-tight">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-sky-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/[0.05]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 6. FINAL CTA ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28 text-center">
          <div className="p-8 sm:p-12 rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/30 to-[#0A0D15] space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Never lose an attendance punch to network failure.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Deploy resilient, hardware-anchored biometric kiosks on your standard tablets or PCs in under 24 hours.
            </p>
            <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
              >
                View Plans & Pricing
              </Link>
              <a
                href="https://wa.me/2349113380364?text=Hello%20TimeLogic%2C%20we%20want%20to%20deploy%20offline%20biometric%20attendance."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
              >
                Request Deployment Assistance
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
