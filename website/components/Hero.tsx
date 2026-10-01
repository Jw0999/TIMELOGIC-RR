"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Clock,
  FileSpreadsheet,
  Lock,
} from "lucide-react";
import { Button } from "./ui/Button";

export function Hero() {
  return (
    <section className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 bg-[#070d1e] text-white border-b border-white/[0.08] overflow-hidden bg-grid-pattern">
      {/* Subtle architectural radial lighting (restrained, no cartoon neon) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(37,99,235,0.14),transparent)]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* ── Left Column: Precise Value Proposition & Clear CTAs ── */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Status indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/60 border border-blue-500/20 text-xs font-medium text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>On-Premise Biometric Kiosk Infrastructure</span>
            </div>

            {/* High-conviction typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-[-0.03em] leading-[1.18]">
              Workforce attendance locked to <br className="hidden sm:inline" />
              <span className="text-sky-400">physical company hardware.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl">
              Eliminate proxy check-ins, mobile GPS spoofing, and unmonitored break overstays. TimeLogic binds attendance strictly to authorized on-premise kiosk terminals with facial biometric verification and 1-click Excel payroll exports.
            </p>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex items-center gap-3.5 flex-wrap">
              <Button
                variant="primary"
                size="md"
                href="/pricing"
                icon={<ArrowRight size={15} />}
                iconPosition="right"
                className="font-semibold shadow-sm text-xs sm:text-sm"
              >
                View Monthly Plans & Pricing
              </Button>

              <Button
                variant="outline"
                size="md"
                href="https://wa.me/2349113380364"
                icon={<MessageSquare size={14} />}
                className="text-xs sm:text-sm text-slate-200 border-white/15 hover:bg-white/10"
              >
                Chat with Deployment Team
              </Button>
            </div>

            {/* Operational Verification Highlights */}
            <div className="pt-6 grid grid-cols-2 gap-3 border-t border-white/[0.08] text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0" />
                <span>Zero GPS mock-location spoofing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0" />
                <span>Sub-second biometric facial lock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0" />
                <span>Automated break overstay alarms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0" />
                <span>1-click Microsoft Excel export</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Authentic Production Interface Showcase ── */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-white/[0.12] bg-[#0b142c] shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="h-9 px-4 bg-[#080d1e] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 ml-2">timelogic-admin · Live Presence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">Terminal Paired</span>
                </div>
              </div>

              {/* Main Interface Capture */}
              <div className="relative aspect-[16/10] bg-[#070d1e] overflow-hidden">
                <img
                  src="/screenshots/admin-dashboard.png"
                  alt="TimeLogic Live Executive Attendance Dashboard"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Hardware telemetry status ribbon */}
              <div className="px-4 py-2.5 bg-[#080d1e] border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-sky-400" />
                  <span>On-Premise Kiosk #01 Active</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span>Server Clock Sync: 0ms drift</span>
                  <span className="hidden sm:inline text-sky-400">Verification: 100% Locked</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── 3 Concrete Infrastructure Pillars ── */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
              <Cpu size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Hardware-Bound Kiosk Authorization
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Check-ins can only be registered on designated company computers or tablets physically paired to your workplace network. Remote GPS spoofing is architecturally impossible.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Granular Break & Policy Tracking
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enforce defined allowances for lunch, short breaks, and prayer sessions. The system automatically logs duration in minutes and alerts managers the moment an employee overstays.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              1-Click Payroll-Ready Reporting
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Replace multi-day manual spreadsheet compilation. Export fully audited, mathematically verified Microsoft Excel (.xlsx) and CSV sheets ready for instant payroll disbursement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
