"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Clock,
  AlertTriangle,
  Building2,
  Fingerprint,
  ScanFace,
  MessageSquare,
} from "lucide-react";

interface ComparisonRow {
  dimension: string;
  fingerprint: string;
  timelogic: string;
  advantage: string;
  isTimelogicWinner: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: "Punch Speed & Queue Throughput",
    fingerprint: "2.5 – 4.5 seconds per employee (often requires multiple press attempts)",
    timelogic: "Under 0.8 seconds (instant match as staff member walks up to kiosk)",
    advantage: "5x Faster Queue Clearance",
    isTimelogicWinner: true,
  },
  {
    dimension: "Contact & Hygiene Safety",
    fingerprint: "High physical contact: hundreds of staff touch the same glass prism daily",
    timelogic: "100% Contactless: verified by camera from 0.5m – 1.0m away",
    advantage: "Zero Germ Spread",
    isTimelogicWinner: true,
  },
  {
    dimension: "Dirty, Worn, or Dry Hands",
    fingerprint: "15% – 25% failure rate for mechanics, cooks, medical staff, and dry skin",
    timelogic: "0% hand dependency: verifies mathematical facial geometry landmarks",
    advantage: "Zero False Rejection",
    isTimelogicWinner: true,
  },
  {
    dimension: "Hardware Durability & Wear",
    fingerprint: "Optical glass scratches, silicone covers degrade, sensor requires replacement",
    timelogic: "Runs on off-the-shelf Android tablets or computers with standard cameras",
    advantage: "Zero Mechanical Wear",
    isTimelogicWinner: true,
  },
  {
    dimension: "Upfront & Maintenance Costs",
    fingerprint: "Expensive proprietary terminals ($300 – $1,200) + high replacement parts",
    timelogic: "Deploy on your existing office tablets or computers with ₦0 specialized hardware",
    advantage: "Lowest Total Cost of Ownership",
    isTimelogicWinner: true,
  },
  {
    dimension: "Anti-Spoofing & Proxy Protection",
    fingerprint: "Vulnerable to silicone fake fingers, gelatin molds, or supervisor overrides",
    timelogic: "Hardware-anchored terminal + sub-second 3D depth and photo-spoof detection",
    advantage: "Cryptographic Tamper-Proof",
    isTimelogicWinner: true,
  },
  {
    dimension: "Offline Functionality",
    fingerprint: "Proprietary firmware logs frequently corrupt during power cuts or storage overflow",
    timelogic: "Local encrypted SQLite/IndexedDB caching; auto-syncs seamlessly upon reconnect",
    advantage: "Guaranteed Offline Sync",
    isTimelogicWinner: true,
  },
  {
    dimension: "Payroll & Reporting Workflow",
    fingerprint: "Manual USB thumb drive extraction or complex serial port desktop software",
    timelogic: "Real-time cloud super-admin dashboard with 1-click reconciled Excel/CSV exports",
    advantage: "Zero Manual Data Entry",
    isTimelogicWinner: true,
  },
];

const VS_FAQS = [
  {
    question: "Why do optical fingerprint scanners fail so often in commercial workplaces?",
    answer:
      "Optical fingerprint scanners rely on light reflectance through a glass prism. Over time, grease, dust, scratches, and sweat degrade the sensor. In addition, workers with worn fingerprints (e.g. elderly staff, healthcare workers using alcohol sanitizer, construction crews, and kitchen teams) suffer up to 25% false rejection rates, causing frustrating morning bottlenecks.",
  },
  {
    question: "Is facial recognition attendance hygienic compared to fingerprint clocks?",
    answer:
      "Yes, completely. Fingerprint scanners are high-touch communal surfaces touched by hundreds of employees every morning, facilitating viral transmission. TimeLogic facial recognition is 100% contactless—employees simply glance at the kiosk station from a comfortable standing distance without touching any glass.",
  },
  {
    question: "Can an employee trick TimeLogic facial recognition with a printed photo or phone selfie?",
    answer:
      "No. TimeLogic utilizes multi-factor anti-spoofing algorithms that analyze depth, liveness, and dynamic lighting reflections. Static printed photos, phone screen reproductions, and video replays are automatically flagged and rejected by the kiosk verification engine.",
  },
  {
    question: "Do we need to buy specialized cameras to replace our fingerprint terminals?",
    answer:
      "No specialized cameras are required. TimeLogic operates smoothly on the standard front-facing cameras of budget Android tablets, iPads, laptops, or desktop monitors running Windows or Linux. You can repurpose existing office hardware without purchasing proprietary biometric clocks.",
  },
];

export default function FingerprintVsFacialPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vsSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: VS_FAQS.map((faq) => ({
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
      {/* Schema.org FAQPage for this comparison */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vsSchema) }}
      />

      <Header />

      <main className="w-full flex-1 pt-12 pb-24 sm:pt-16 sm:pb-32">
        {/* ── 1. HERO SECTION ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
            <Layers size={14} className="text-sky-400" />
            <span>Biometric Technology Architecture Guide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Facial Recognition Kiosks vs.{" "}
            <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">
              Optical Fingerprint Scanners
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Why modern corporate offices, medical clinics, schools, and factories are replacing fragile, high-maintenance fingerprint time clocks with sub-second contactless facial verification.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-[0.98]"
            >
              <span>Explore TimeLogic Plans</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://wa.me/2349113380364?text=Hello%20TimeLogic%2C%20we%20want%20to%20replace%20our%20fingerprint%20scanners%20with%20facial%20kiosks."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <MessageSquare size={14} className="text-sky-400" />
              <span>Discuss Migration with Lead Engineer</span>
            </a>
          </div>
        </div>

        {/* ── 2. HEAD-TO-HEAD COMPARISON TABLE ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-16 sm:mt-24">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Head-to-Head Specification Matrix
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Compare key operational reliability factors between traditional hardware scanners and TimeLogic kiosk software.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E121B]/90 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5 sm:px-6 w-1/4">Evaluation Factor</th>
                    <th className="py-4 px-5 sm:px-6 w-1/3 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Fingerprint size={16} className="text-slate-400" />
                        <span>Traditional Fingerprint Clock</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 sm:px-6 w-5/12 text-sky-300 bg-sky-500/[0.04]">
                      <div className="flex items-center gap-2">
                        <ScanFace size={16} className="text-sky-400" />
                        <span className="font-bold">TimeLogic Facial Kiosk</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-5 sm:px-6 font-semibold text-white align-top">
                        {row.dimension}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-slate-300 align-top">
                        <div className="flex items-start gap-2">
                          <XCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{row.fingerprint}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 sm:px-6 bg-sky-500/[0.03] text-slate-200 align-top">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">{row.timelogic}</span>
                            <span className="block mt-1 text-[11px] font-mono text-sky-400 font-semibold">
                              ★ {row.advantage}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 3. THE 4 HIDDEN PITFALLS OF FINGERPRINT TERMINALS ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono font-medium text-rose-300">
              <AlertTriangle size={14} className="text-rose-400" />
              <span>Operational Risk Analysis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 4 Hidden Costs of Legacy Fingerprint Readers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Daily Queue Bottlenecks</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                When a fingerprint scanner fails on an employee’s wet, oily, or dry thumb, they retry 3–4 times. For a team of 100 employees, this wastes 15–20 minutes every morning in line just to register arrival.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Prism Wear & Replacement Cycles</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Optical glass prisms degrade from skin oils, hand sanitizers, and rings. Replacing worn sensors costs $150–$400 each time and takes weeks of waiting for proprietary vendor shipments.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Data Loss During Outages</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Legacy time clocks rely on volatile internal storage. Power surges, full memory chips, or broken USB transfers frequently result in lost attendance records and contested payroll deductions.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono font-bold text-sm">
                04
              </div>
              <h3 className="text-lg font-bold text-white">Manual Timesheet Re-Entry</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                HR staff must manually export proprietary `.txt` or `.dat` files from old fingerprint clocks and painstakingly compute lateness penalties in Excel, consuming 10–15 hours of administrative time monthly.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. SPECIFIC COMPARISON FAQ ── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Clear answers on upgrading from fingerprint readers to TimeLogic kiosks.
            </p>
          </div>

          <div className="space-y-3.5">
            {VS_FAQS.map((faq, idx) => {
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

        {/* ── 5. FINAL CALL TO ACTION BANNER ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28 text-center">
          <div className="p-8 sm:p-12 rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/30 to-[#0A0D15] space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to replace fragile fingerprint scanners?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Deploy contactless, sub-second facial verification kiosks on your existing devices in under 24 hours. No expensive hardware purchases required.
            </p>
            <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
              >
                View Transparent Pricing
              </Link>
              <a
                href="https://wa.me/2349113380364?text=Hello%20TimeLogic%2C%20we%20want%20a%20free%20demo%20of%20the%20facial%20recognition%20kiosk."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
              >
                Schedule Direct WhatsApp Demo
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
