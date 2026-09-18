"use client";

import React from "react";
import Link from "next/link";
import {
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/Button";

export function Hero() {
  return (
    <section className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 border-b border-white/[0.08] overflow-hidden">
      {/* Subtle, restrained background structure (no giant garish blobs) */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(37,99,235,0.03)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Editorial Top Headline & Subtitle */}
        <div className="max-w-3xl space-y-5">
          {/* Subtle announcement pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>TimeLogic Enterprise Attendance Kiosk</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Zero Buddy-Punching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-[-0.035em] leading-[1.12]">
            Workforce attendance you can{" "}
            <span className="text-blue-400">actually verify.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed font-normal max-w-2xl">
            Eliminate ghost workers, buddy-punching, and unmonitored breaks. TimeLogic locks daily check-ins to authorized on-premise kiosk stations, biometric face verification, and live office network presence.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center gap-3.5 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={15} />}
            >
              Call Deployment Team (09036627043)
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="/solution"
              icon={<ArrowRight size={15} />}
              iconPosition="right"
            >
              View System Architecture
            </Button>
          </div>

          {/* Real Operational Facts */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/[0.08] text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
              <span>Hardware-locked kiosk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
              <span>Zero GPS mobile spoofing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
              <span>Live break window audit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
              <span>1-click Excel export</span>
            </div>
          </div>
        </div>

        {/* Real Product Interface Showcase */}
        <div className="mt-14 sm:mt-18">
          <div className="rounded-xl border border-white/[0.12] bg-[#0c0e14] shadow-2xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="h-10 px-4 bg-[#11141c] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="ml-3 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  timelogic.app/admin/dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Sync
                </span>
                <span className="text-[11px] text-slate-500">BEAMON UNIQUE Front desk</span>
              </div>
            </div>

            {/* Actual Screenshot of the real TimeLogic Admin Panel */}
            <div className="relative aspect-[16/9] sm:aspect-[16/8.5] w-full bg-[#08090d]">
              <img
                src="/screenshots/admin-dashboard.png"
                alt="TimeLogic Live Admin Dashboard showing real-time workforce metrics and attendance breakdown"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Contextual caption below screenshot */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              <strong className="text-slate-200">Live Executive Command Center:</strong> Monitor present rates, late arrivals, on-leave personnel, and active break policies in real time.
            </div>
            <Link
              href="/post"
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <span>Explore all 8 system screens</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* 3 Concrete Infrastructure Pillars */}
        <div className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu size={20} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              On-Premise Kiosk Authorization
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Attendance can only be logged on authorized company kiosk terminals physically located on the office network. Employees cannot check in from home, beds, or vehicles.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Granular Break & Policy Tracking
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitor lunch, short breaks, prayer, and nursing hours against strict daily windows. The system automatically triggers high-priority alerts if break durations are exceeded.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              1-Click Payroll-Ready Reporting
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Stop wasting 3 to 5 days manually tallying paper logbooks. One click exports clean, audited Excel and CSV spreadsheets ready for immediate salary computation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
