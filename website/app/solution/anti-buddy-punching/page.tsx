"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Clock,
  Laptop,
  ScanFace,
  ChevronDown,
  ArrowRight,
  Mail,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

const ANTI_BUDDY_FAQS = [
  {
    question: "What is buddy punching and how much does it cost employers?",
    answer:
      "Buddy punching occurs when an employee clocks in or out on behalf of an absent or late colleague. According to the American Payroll Association (APA), buddy punching affects over 75% of businesses and inflates gross payroll costs by 2.2% to 5% annually, draining thousands of dollars in unworked hours.",
  },
  {
    question: "Why can't mobile attendance apps with GPS stop buddy punching?",
    answer:
      "Mobile attendance apps are easily manipulated. Employees can download 'Mock GPS' or location-spoofing apps from app stores to fake their location while still in bed. Furthermore, employees frequently share login credentials, PINs, or phone sessions with coworkers already on-site to punch in remotely for them.",
  },
  {
    question: "Can an employee clock in using a photograph or video of their coworker?",
    answer:
      "No. TimeLogic’s facial verification engine employs sub-second anti-spoofing algorithms that analyze depth, motion dynamics, and micro-reflections. Static printed photos, selfies on smartphone screens, and prerecorded video playback are immediately detected and rejected by the kiosk station.",
  },
  {
    question: "What happens if an employee tries to change the time on the kiosk computer?",
    answer:
      "TimeLogic uses cryptographic server-clock synchronization. The kiosk station references network time protocols (NTP) and server-side cryptographic timestamps. Manually changing the local computer or tablet clock has zero effect on the recorded punch time.",
  },
];

export default function AntiBuddyPunchingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ANTI_BUDDY_FAQS.map((faq) => ({
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-xs font-mono font-medium text-rose-300">
            <ShieldAlert size={14} className="text-rose-400" />
            <span>Workforce Fraud Prevention Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Stop Buddy Punching and <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-sky-300 to-blue-500">
              Proxy Clock-Ins Permanently
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            When employees clock in for late or absent coworkers, companies lose up to 5% of gross payroll to phantom hours. TimeLogic binds attendance to physical on-premise kiosks and sub-second facial verification, rendering proxy check-ins mathematically impossible.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-[0.98]"
            >
              <span>View Transparent Plans</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="mailto:support@timelogics.tech?subject=TimeLogic%20Anti-Buddy%20Punching%20Inquiry"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <Mail size={14} className="text-sky-400" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>

        {/* ── 2. EMPIRICAL STATS: THE TRUE IMPACT OF BUDDY PUNCHING ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-16 sm:mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 font-mono">
                75%
              </div>
              <h3 className="text-base font-bold text-white">of Companies Affected</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Over three-quarters of commercial businesses experience frequent buddy punching and coworker badge swapping (American Payroll Association).
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400 font-mono">
                4.5 hrs
              </div>
              <h3 className="text-base font-bold text-white">Lost Per Worker Weekly</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The average employee steals up to 4.5 hours of unworked time each week through late check-ins, early leaves, and unmonitored breaks.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0E121B] space-y-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                100%
              </div>
              <h3 className="text-base font-bold text-white">Zero Proxy Punching</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                TimeLogic guarantees zero proxy clock-ins by requiring the live employee to physically stand in front of the paired on-premise kiosk.
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. THE 3-LAYER DEFENSE ARCHITECTURE ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono font-medium text-sky-300">
              <Layers size={14} className="text-sky-400" />
              <span>Multi-Factor Verification</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              The 3-Layer Anti-Fraud Architecture
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              How TimeLogic eliminates every loophole used by dishonest employees in conventional attendance setups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sky-400">
                <Laptop size={22} />
              </div>
              <span className="text-xs font-mono text-sky-400 font-semibold uppercase">Layer 01</span>
              <h3 className="text-lg font-bold text-white">Physical Hardware Kiosk Lock</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Attendance can only be registered on your designated office computer or tablet. Rogue devices, mobile GPS fakers, and off-site web browsers cannot submit punches.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ScanFace size={22} />
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Layer 02</span>
              <h3 className="text-lg font-bold text-white">Sub-Second Facial Liveness</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Anti-spoofing algorithms verify that a real, living human is standing in front of the kiosk. Photo printouts, smartphone screen selfies, and pre-recorded videos are immediately blocked.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock size={22} />
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase">Layer 03</span>
              <h3 className="text-lg font-bold text-white">Cryptographic Clock Sync</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Punches are signed with server-verified timestamps. Employees cannot adjust computer clocks backwards or alter local system times to fake on-time punctuality.
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. WHY MOBILE APPS FAIL COMPARISON ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-[#0E121B]">
            <div className="max-w-3xl space-y-4 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Why Mobile GPS Apps Fail to Stop Buddy Punching
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Many modern HR apps allow staff to clock in from their personal phones using GPS coordinates. In practice, this creates massive time fraud vulnerabilities:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <XCircle size={16} />
                  <span>Mock GPS Apps Bypass Location</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Freely available apps on Android and iOS allow staff to spoof their latitude/longitude to the office coordinates while still at home in bed.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <XCircle size={16} />
                  <span>Credential & Session Sharing</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Employees routinely log into a coworker’s account or share single-use PINs over messaging apps so friends on-site clock in for them.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 size={16} />
                  <span>TimeLogic: Physical Station Requirement</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Attendance is locked to a physical device inside the facility. No employee can clock in from a personal phone without standing in front of the kiosk.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 size={16} />
                  <span>TimeLogic: Non-Transferable Biometrics</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  You cannot share your face. Every punch requires the employee’s live biometric geometry, eliminating all proxy check-ins forever.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. FAQS ── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 mt-20 sm:mt-28">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Anti-Buddy Punching FAQs
            </h2>
            <p className="text-sm text-slate-400">
              Clear answers on protecting payroll integrity and preventing proxy attendance.
            </p>
          </div>

          <div className="space-y-3.5">
            {ANTI_BUDDY_FAQS.map((faq, idx) => {
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
              Reclaim lost payroll hours today.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Deploy hardware-anchored biometric kiosks on your existing devices in under 24 hours. Stop buddy punching and timesheet inflation permanently.
            </p>
            <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
              >
                View Plans & Pricing
              </Link>
              <a
                href="mailto:support@timelogics.tech?subject=TimeLogic%20Deployment%20Inquiry"
                className="px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
              >
                Contact Deployment Engineering
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
