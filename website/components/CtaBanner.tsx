"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function CtaBanner() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/register?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/register");
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-[#07090E] text-white relative overflow-hidden border-t border-white/[0.08]">
      {/* Ambient Radial Lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,229,255,0.12),transparent_70%)]" />
      
      <div className="max-w-5xl mx-auto px-5 sm:px-6 relative z-10 text-center space-y-8">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-400/30 text-xs font-mono font-medium text-cyan-300 backdrop-blur-md">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>24-Hour Onboarding & Pairing SLA</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.12]">
          Ready to eliminate attendance fraud <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
            across your organization?
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Deploy hardware-anchored biometric kiosks on your existing office computers or tablets in under 24 hours. Our engineering team assists with roster import, kiosk pairing, and shift rules.
        </p>

        {/* Email Input Action Box */}
        <form onSubmit={handleSubmit} className="pt-2 max-w-xl mx-auto">
          <div className="relative flex items-center p-1.5 sm:p-2 rounded-full bg-[#0d1222]/90 border border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all duration-300">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email address..."
              className="w-full bg-transparent px-4 sm:px-5 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Secondary CTAs */}
        <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
          <a
            href="https://wa.me/2349113380364?text=Hello%20TimeLogic%20Team%2C%20we%20would%20like%20to%20deploy%20TimeLogic%20for%20our%20workforce."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-white border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
          >
            <MessageSquare size={14} className="text-cyan-400" />
            <span>Chat Directly on WhatsApp (+234 911 338 0364)</span>
          </a>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span>View Monthly Plans</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Guarantee Points */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-cyan-400" />
            Zero proprietary hardware lock-in
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-cyan-400" />
            Runs on Windows, macOS, Linux, and Android
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-cyan-400" />
            Full payroll reconciliation guarantee
          </span>
        </div>

      </div>
    </section>
  );
}
