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
} from "lucide-react";
import { Button } from "./ui/Button";

export function Hero() {
  return (
    <section className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 theme-page-bg border-b border-theme overflow-hidden bg-grid-pattern transition-colors">
      {/* Subtle architectural radial lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* ── Left Column: Headline, Subtitle, and CTAs ── */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Status indicator badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/20 text-xs font-mono font-medium text-blue-700 dark:text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>On-Premise Biometric Kiosk Infrastructure</span>
            </div>

            {/* High-conviction typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold theme-text-primary tracking-[-0.03em] leading-[1.18]">
              Workforce attendance locked to <br className="hidden sm:inline" />
              <span className="text-blue-600 dark:text-sky-400">physical company hardware.</span>
            </h1>

            {/* Clear, High-Contrast Subtitle (Fixed: Never black in dark mode!) */}
            <p className="text-sm sm:text-base theme-text-secondary leading-relaxed font-normal max-w-xl">
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
                className="font-semibold shadow-xs text-xs sm:text-sm"
              >
                View Monthly Plans & Pricing
              </Button>

              <Button
                variant="outline"
                size="md"
                href="https://wa.me/2349113380364"
                icon={<MessageSquare size={14} />}
                className="text-xs sm:text-sm theme-text-primary border-theme hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Chat with Deployment Team
              </Button>
            </div>

            {/* Operational Verification Highlights */}
            <div className="pt-6 grid grid-cols-2 gap-3 border-t border-theme text-xs theme-text-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
                <span>Zero GPS mock-location spoofing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
                <span>Sub-second biometric facial lock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
                <span>Automated break overstay alarms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
                <span>1-click Microsoft Excel export</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Authentic Production Interface Showcase ── */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-theme theme-card-bg shadow-xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="h-9 px-4 bg-slate-100 dark:bg-[#080d1e] border-b border-theme flex items-center justify-between text-xs theme-text-secondary">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] theme-text-secondary ml-2">timelogic-admin · Live Presence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Terminal Paired</span>
                </div>
              </div>

              {/* Main Interface Capture */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                <img
                  src="/screenshots/admin-dashboard.png"
                  alt="TimeLogic Live Executive Attendance Dashboard"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Hardware telemetry status ribbon */}
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#080d1e] border-t border-theme flex items-center justify-between text-[11px] font-mono theme-text-secondary">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-blue-600 dark:text-sky-400" />
                  <span className="font-medium">On-Premise Kiosk #01 Active</span>
                </div>
                <div className="flex items-center gap-3 theme-text-muted">
                  <span>Server Clock Sync: 0ms drift</span>
                  <span className="hidden sm:inline text-blue-600 dark:text-sky-400 font-semibold">Verification: 100% Locked</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── 3 Concrete Infrastructure Pillars ── */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl theme-card-bg border border-theme space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-sky-300 flex items-center justify-center">
              <Cpu size={18} />
            </div>
            <h3 className="text-sm font-semibold theme-text-primary tracking-tight">
              Hardware-Bound Kiosk Authorization
            </h3>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Check-ins can only be registered on designated company computers or tablets physically paired to your workplace network. Remote GPS spoofing is architecturally impossible.
            </p>
          </div>

          <div className="p-6 rounded-xl theme-card-bg border border-theme space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-sky-300 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h3 className="text-sm font-semibold theme-text-primary tracking-tight">
              Granular Break & Policy Tracking
            </h3>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Enforce defined allowances for lunch, short breaks, and prayer sessions. The system automatically logs duration in minutes and alerts managers the moment an employee overstays.
            </p>
          </div>

          <div className="p-6 rounded-xl theme-card-bg border border-theme space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-sky-300 flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <h3 className="text-sm font-semibold theme-text-primary tracking-tight">
              1-Click Payroll-Ready Reporting
            </h3>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Replace multi-day manual spreadsheet compilation. Export fully audited, mathematically verified Microsoft Excel (.xlsx) and CSV sheets ready for instant payroll disbursement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
