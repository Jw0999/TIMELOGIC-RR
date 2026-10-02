"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20 sm:py-28 bg-[#090A0F] text-white relative overflow-hidden border-t border-white/[0.08]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 relative z-10 text-center space-y-8">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
          <ShieldCheck size={14} className="text-sky-400" />
          <span>24-Hour Onboarding & Pairing SLA</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-[48px] font-bold text-white tracking-tight leading-[1.14]">
          Ready to eliminate attendance fraud <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">
            across your organization?
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Deploy hardware-anchored biometric kiosks on your existing office computers or tablets in under 24 hours. Our engineering team assists with roster import, kiosk pairing, and shift rules.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-[0.98]"
          >
            <span>View Monthly Plans & Pricing</span>
            <ArrowRight size={14} />
          </Link>

          <a
            href="https://wa.me/2349113380364?text=Hello%20TimeLogic%20Team%2C%20we%20would%20like%20to%20deploy%20TimeLogic%20for%20our%20workforce."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <MessageSquare size={14} className="text-sky-400" />
            <span>Chat on WhatsApp (+234 911 338 0364)</span>
          </a>
        </div>

        {/* Guarantee Points */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-sky-400" />
            Zero proprietary hardware lock-in
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-sky-400" />
            Runs on Windows, macOS, Linux, and Android
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-sky-400" />
            Full payroll reconciliation guarantee
          </span>
        </div>

      </div>
    </section>
  );
}
