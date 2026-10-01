"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  MessageSquare,
  Lock,
  Globe2,
  DollarSign,
  ShieldCheck,
  Quote,
} from "lucide-react";

export default function InvestorsPage() {
  const investmentQuotes = [
    {
      quote:
        "The most defensible software companies solve deep operational leaks where removing the tool would immediately compromise company revenue or payroll integrity.",
      attribution: "B2B Software Investment Principle",
    },
    {
      quote:
        "Time theft, buddy-punching, and ghost workers drain an estimated 4.5 hours per employee each week in unverified operations—representing hundreds of billions in annual global enterprise losses.",
      attribution: "Global Workforce Economics Research",
    },
    {
      quote:
        "When an attendance platform becomes the trusted record for biometric check-in and payroll calculation, customer churn drops to near zero.",
      attribution: "Enterprise SaaS Retention Dynamics",
    },
  ];

  const marketMetrics = [
    {
      label: "Global Workforce Fraud Cost",
      value: "$400B+",
      description: "Annual losses attributed to unverified attendance and buddy-punching across commercial enterprises.",
    },
    {
      label: "Target Facility Market",
      value: "Millions",
      description: "Commercial offices, clinics, schools, and factories currently relying on manual paper logbooks.",
    },
    {
      label: "Gross Margin Profile",
      value: "80%+",
      description: "High-margin cloud SaaS with standard off-the-shelf hardware compatibility.",
    },
    {
      label: "Mission-Critical Moat",
      value: "Near-Zero Churn",
      description: "Direct operational tie-in to monthly payroll computation makes replacement highly disruptive.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO HEADER ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-[#070d1e] border-b border-white/[0.08] bg-grid-pattern">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/60 border border-blue-500/20 text-xs font-mono font-medium text-sky-300">
            Capital & Strategic Partnerships
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Invest in TimeLogic
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Building the foundational infrastructure for verified workplace presence and tamper-proof payroll data across emerging and established commercial markets.
          </p>

          <div className="pt-3 flex items-center justify-center gap-3.5 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="mailto:invest@timelogics.tech?subject=Investment%20Inquiry%20-%20TimeLogic"
              icon={<Mail size={14} />}
              className="text-xs sm:text-sm font-semibold shadow-sm"
            >
              Email: invest@timelogics.tech
            </Button>
            <Button
              variant="outline"
              size="md"
              href="https://wa.me/2349113380364"
              icon={<MessageSquare size={14} />}
              className="text-xs sm:text-sm text-slate-200 border-white/15 hover:bg-white/10"
            >
              Contact on WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: INVESTMENT QUOTES ── */}
      <section className="py-20 sm:py-24 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {investmentQuotes.map((item, idx) => (
              <div
                key={idx}
                className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] flex flex-col justify-between space-y-4"
              >
                <Quote className="text-sky-400/80 w-6 h-6" />
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="text-[11px] font-mono text-sky-400 border-t border-white/[0.06] pt-3">
                  — {item.attribution}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE THESIS & METRICS ── */}
      <section className="py-20 sm:py-24 bg-[#070d1e] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/60 border border-blue-500/20 text-xs font-mono font-medium text-sky-300">
              Investment Thesis
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Why TimeLogic Represents A High-Conviction Market Opportunity
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Attendance management in commercial enterprises is structurally broken. TimeLogic captures this high-margin vertical through hardware-bound moats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h3 className="text-base font-bold text-white">
                Defensible Hardware-Bound Verification Moat
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mobile-only attendance apps experience severe customer churn because workers easily bypass GPS restrictions with mock location tools. TimeLogic binds check-in to physical on-premise kiosks, server-locked clocks, and facial biometrics. This creates immutable data integrity that organizations rely on daily.
              </p>
            </div>

            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
                <Globe2 size={18} />
              </div>
              <h3 className="text-base font-bold text-white">
                Massive Emerging & Greenfield Market Opportunity
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Across sub-Saharan Africa, Latin America, and Southeast Asia, millions of growing businesses, hospitals, schools, and factories still record attendance with paper books. TimeLogic offers frictionless 24-hour setup using existing office hardware, unlocking vast greenfield ARR.
              </p>
            </div>

            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <h3 className="text-base font-bold text-white">
                High-Margin Predictable B2B SaaS Economics
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Customers subscribe on transparent monthly terms per employee headcount. As businesses hire additional workers or open new branch locations, net retention naturally expands with near-zero marginal cost to serve.
              </p>
            </div>

            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-base font-bold text-white">
                Immediate Operational ROI For Clients
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                By eliminating buddy-punching, ghost workers, and overstayed breaks, TimeLogic routinely recovers thousands of dollars in payroll leakage in the first 30 days of deployment. The software pays for itself immediately, insulating it from budget cuts.
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {marketMetrics.map((m) => (
              <div key={m.label} className="p-5 rounded-xl bg-[#0b142c] border border-white/[0.08]">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-semibold text-sky-400 mt-1">
                  {m.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {m.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: INQUIRY CTA BOX ── */}
      <section className="py-20 sm:py-24 bg-[#091124]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Request Our Investor Memorandum & Metrics
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            We welcome conversations with qualified angel investors, venture capital funds, and strategic partners interested in workforce infrastructure.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3.5 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="mailto:invest@timelogics.tech?subject=Investment%20Inquiry%20-%20TimeLogic"
              icon={<Mail size={15} />}
              className="text-xs sm:text-sm font-semibold shadow-sm"
            >
              Email: invest@timelogics.tech
            </Button>
            <Button
              variant="outline"
              size="md"
              href="https://wa.me/2349113380364"
              icon={<MessageSquare size={15} />}
              className="text-xs sm:text-sm text-slate-200 border-white/15 hover:bg-white/10"
            >
              Contact on WhatsApp
            </Button>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Confidential deck and financial model available upon request.
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
