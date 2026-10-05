"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck, Zap } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What makes TimeLogic different from ordinary punch-card or fingerprint attendance systems?",
    answer:
      "TimeLogic replaces vulnerable fingerprint scanners and easily manipulated punch cards with 3-layer verification: physical kiosk hardware anchoring, sub-second anti-spoofing facial recognition, and cryptographic timestamping. This completely eliminates buddy punching, proxy check-ins, and manual timesheet fraud across your workforce.",
  },
  {
    question: "Can employees clock in when our office or job site has no internet connection?",
    answer:
      "Yes. TimeLogic is built offline-first. The kiosk station performs biometric facial recognition and records tamper-proof timestamps locally on the device. As soon as an internet connection (Wi-Fi or cellular hotspot) is detected, all offline attendance records automatically synchronize to the super-admin dashboard with zero data loss.",
  },
  {
    question: "What hardware or devices are required to run a TimeLogic attendance station?",
    answer:
      "TimeLogic runs on standard, accessible devices. You can deploy the TimeLogic Station on standard Android tablets, iPads, or Windows and Linux computers equipped with a front camera. You never have to buy overpriced proprietary biometric hardware or fragile optical finger sensors.",
  },
  {
    question: "How does TimeLogic protect employee biometric privacy and maintain GDPR/NDPR compliance?",
    answer:
      "TimeLogic converts facial landmarks into irreversible mathematical vectors rather than storing raw facial photographs. All data is encrypted in transit via TLS 1.3 and encrypted at rest with industry-standard protocols, ensuring full compliance with modern international privacy regulations including GDPR and NDPR.",
  },
  {
    question: "Can TimeLogic manage multi-branch enterprises, remote workers, and flexible shift rosters?",
    answer:
      "Yes. TimeLogic provides unified multi-branch management from a central dashboard. You can create unlimited physical branches, configure morning, evening, or rotational shifts, set automated grace periods for lateness, and export real-time, audit-ready payroll reports with one click.",
  },
  {
    question: "How quickly can an organization onboard and deploy TimeLogic?",
    answer:
      "Most companies go live within 24 hours. You can import your employee directory via CSV or Excel, configure your company shift rules, and pair your first kiosk station in minutes. Our deployment team is available via WhatsApp and direct onboarding support to ensure seamless rollout.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#090A0F] text-white relative overflow-hidden border-t border-white/[0.08]">
      {/* Schema.org FAQPage JSON-LD for Google & Bing Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-5 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
            <HelpCircle size={14} className="text-sky-400" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Everything you need to know about{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">
              TimeLogic
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Direct answers regarding biometric kiosk hardware, offline synchronization, anti-buddy punching protection, and workforce data privacy.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-white/[0.04] border-sky-500/40 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
                    : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full py-5 px-6 sm:px-7 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {item.question}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 bg-sky-500/10 border-sky-500/40 text-sky-400"
                        : "border-white/10 text-slate-400"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-7 pb-6 pt-1 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-white/[0.05]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-sky-400" />
          <span>Have a custom compliance or hardware inquiry?</span>
          <a
            href="https://wa.me/2349113380364?text=Hello%20TimeLogic%2C%20I%20have%20a%20question%20about%20your%20biometric%20attendance%20system."
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline font-semibold transition-colors"
          >
            Chat with our engineering team
          </a>
        </div>
      </div>
    </section>
  );
}
