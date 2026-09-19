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
    <section className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 bg-white text-slate-900 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Editorial Top Headline & Subtitle */}
        <div className="max-w-3xl space-y-5">
          {/* Subtle announcement pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse" />
            <span>TimeLogic Enterprise Attendance Kiosk</span>
            <span className="text-blue-300">•</span>
            <span>Zero Buddy-Punching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-[-0.035em] leading-[1.12]">
            Workforce attendance you can{" "}
            <span className="text-blue-600">actually verify.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
            Eliminate ghost workers, buddy-punching, and unmonitored breaks. TimeLogic locks daily check-ins to authorized on-premise kiosk stations, biometric face verification, and live office network presence.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center gap-3.5 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={16} />}
              className="shadow-md hover:shadow-lg"
            >
              Call Deployment Team (09036627043)
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/solution"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
              className="text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              View System Architecture
            </Button>
          </div>

          {/* Real Operational Facts */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
              <span>Hardware-locked kiosk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
              <span>Zero GPS mobile spoofing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
              <span>Live break window audit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
              <span>1-click Excel export</span>
            </div>
          </div>
        </div>

        {/* Real Product Interface Showcase in crisp frame */}
        <div className="mt-14 sm:mt-18">
          <div className="rounded-2xl border border-slate-300/80 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-black/5">
            {/* Window Top Bar */}
            <div className="h-10 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  timelogic.app/admin/dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
                <span className="text-[11px] text-slate-400">BEAMON UNIQUE Front desk</span>
              </div>
            </div>

            {/* Actual Screenshot of TimeLogic Admin Panel */}
            <div className="relative aspect-[16/9] sm:aspect-[16/8.5] w-full bg-slate-950">
              <img
                src="/screenshots/admin-dashboard.png"
                alt="TimeLogic Live Admin Dashboard showing real-time workforce metrics and attendance breakdown"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Contextual caption below screenshot */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              <strong className="text-slate-800 font-semibold">Live Executive Command Center:</strong> Monitor present rates, late arrivals, on-leave personnel, and active break policies in real time.
            </div>
            <Link
              href="/post"
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore all 8 system screens</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* 3 Concrete Infrastructure Pillars in Light Cards */}
        <div className="mt-18 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
              <Cpu size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">
              On-Premise Kiosk Authorization
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Attendance can only be logged on authorized company kiosk terminals physically located on the office network. Employees cannot check in from home, beds, or vehicles.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">
              Granular Break & Policy Tracking
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Monitor lunch, short breaks, prayer, and nursing hours against strict daily windows. The system automatically triggers high-priority alerts if break durations are exceeded.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">
              1-Click Payroll-Ready Reporting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stop wasting 3 to 5 days manually tallying paper logbooks. One click exports clean, audited Excel and CSV spreadsheets ready for immediate salary computation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
