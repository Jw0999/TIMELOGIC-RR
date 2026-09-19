"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "./ui/Button";

export function Hero() {
  return (
    <section className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 bg-[#070e24] text-white border-b border-blue-900/50 overflow-hidden">
      {/* Subtle architectural gradient background matching TimeLogic web app */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.22),transparent)]" />
      <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ── Left Column: Editorial Headline, Subtitle, and CTAs (Slide In Left) ── */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Subtle mature status chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs font-semibold text-sky-300">
              <ShieldCheck size={14} className="text-sky-400" />
              <span>TimeLogic Enterprise Attendance Kiosk</span>
              <span className="text-blue-300/60">•</span>
              <span>Zero Buddy-Punching</span>
            </div>

            {/* Well-proportioned, mature typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-[-0.03em] leading-[1.18]">
              Workforce attendance you can <br className="hidden sm:inline" />
              <span className="text-sky-400">actually verify.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl">
              Eliminate ghost workers, buddy-punching, and unmonitored breaks. TimeLogic locks daily check-ins to authorized on-premise kiosk stations, biometric facial verification, and live office network presence.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3.5 flex-wrap">
              <Button
                variant="primary"
                size="lg"
                href="tel:09036627043"
                icon={<PhoneCall size={16} />}
                className="shadow-lg hover:shadow-xl shadow-blue-600/30"
              >
                Call Deployment Team (09036627043)
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/solution"
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                className="text-white border-white/20 hover:bg-white/10"
              >
                View System Architecture
              </Button>
            </div>

            {/* Operational Verification Highlights */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-sky-400 flex-shrink-0" />
                <span>Hardware-locked kiosk</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-sky-400 flex-shrink-0" />
                <span>Zero GPS spoofing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-sky-400 flex-shrink-0" />
                <span>Live break window audit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-sky-400 flex-shrink-0" />
                <span>1-click Excel export</span>
              </div>
            </div>
          </motion.div>

          {/* ── Right Column: Secure.png 3D Shield (Slide In Right + Subtle Float) ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex flex-col items-center justify-center relative"
          >
            {/* Ambient shield glow backdrop */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full bg-blue-500/20 blur-[90px]" />
            </div>

            {/* Floating 3D Shield Image */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] aspect-square flex items-center justify-center p-4 drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)]"
            >
              <img
                src="/secure.png"
                alt="TimeLogic Verified Security Shield — Tamper-Proof Attendance Guarantee"
                className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(37,99,235,0.4)]"
              />
            </motion.div>

            {/* Subtle verification badge below shield */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-2 relative z-20 px-4 py-2 rounded-xl bg-[#0e1e4a]/90 border border-blue-400/30 shadow-lg backdrop-blur-md flex items-center gap-2.5 text-xs text-blue-100 font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% Cryptographic On-Premise Lock</span>
              <span className="text-blue-300">•</span>
              <span className="text-sky-300">Biometric Verified</span>
            </motion.div>
          </motion.div>

        </div>

        {/* ── 3 Concrete Infrastructure Pillars ── */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-7 rounded-2xl bg-[#0e1d44] border border-blue-400/20 shadow-md space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-sky-300 flex items-center justify-center font-bold">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              On-Premise Kiosk Authorization
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed">
              Attendance can only be logged on authorized company kiosk terminals physically located on the office network. Employees cannot check in from home, beds, or vehicles.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-7 rounded-2xl bg-[#0e1d44] border border-blue-400/20 shadow-md space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-sky-300 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Granular Break & Policy Tracking
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed">
              Monitor lunch, short breaks, prayer, and nursing hours against strict daily windows. The system automatically triggers high-priority alerts if break durations are exceeded.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-7 rounded-2xl bg-[#0e1d44] border border-blue-400/20 shadow-md space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-sky-300 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              1-Click Payroll-Ready Reporting
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed">
              Stop wasting 3 to 5 days manually tallying paper logbooks. One click exports clean, audited Excel and CSV spreadsheets ready for immediate salary computation.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
