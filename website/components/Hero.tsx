"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ScanFace,
  Clock,
  Laptop,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

export function Hero() {
  const [activeStage, setActiveStage] = useState(0);

  const workflowStages = [
    {
      id: 0,
      step: "STAGE 01",
      title: "Import Staff",
      sub: "CSV Roster & Departments",
      badge: "1-Click Sync",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      description: "Import employee rosters, assign departments, shift schedules, and manager approval hierarchies in seconds.",
      detailMetric: "350+ Staff Roster Loaded",
    },
    {
      id: 1,
      step: "STAGE 02",
      title: "Face Verification",
      sub: "Sub-Second Biometric Lock",
      badge: "Anti-Spoof 3D",
      icon: ScanFace,
      color: "from-cyan-500 to-blue-500",
      description: "Cryptographically binds employee identity to facial biometrics. Prevents buddy-punching, photo spoofs, and proxy check-ins.",
      detailMetric: "< 1.2s Face Match Speed",
    },
    {
      id: 2,
      step: "STAGE 03",
      title: "Live Shifts & Rules",
      sub: "Grace Periods & Overstay",
      badge: "Rule Engine",
      icon: Clock,
      color: "from-sky-400 to-cyan-500",
      description: "Enforce strict work hours, configurable grace windows, lunch/prayer break allowances, and automated penalty deductions.",
      detailMetric: "0ms Server-Clock Drift",
    },
    {
      id: 3,
      step: "STAGE 04",
      title: "Kiosk Punch-In",
      sub: "Hardware-Bound Station",
      badge: "Hardware Locked",
      icon: Laptop,
      color: "from-teal-400 to-sky-500",
      description: "Turn any standard office PC, laptop, or tablet into an authorized tamper-proof kiosk station. Zero GPS spoofing.",
      detailMetric: "Terminal #01 Verified",
    },
    {
      id: 4,
      step: "STAGE 05",
      title: "Automated Payroll",
      sub: "1-Click Verified Excel",
      badge: "Audited Ledger",
      icon: FileSpreadsheet,
      color: "from-emerald-400 to-cyan-500",
      description: "Export mathematically reconciled Microsoft Excel (.xlsx) and CSV attendance sheets ready for instant payroll disbursement.",
      detailMetric: "100% Payroll Reconciliation",
    },
  ];

  // Auto-cycle through the workflow stages every 3.5s for dynamic showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % workflowStages.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [workflowStages.length]);

  return (
    <section className="relative w-full pt-16 sm:pt-24 pb-20 sm:pb-28 bg-[#090A0F] text-white overflow-hidden">
      {/* Subtle architectural depth lighting (no loud neon overload) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_40%_at_50%_0%,rgba(56,189,248,0.08),transparent_70%)]" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 space-y-10 sm:space-y-14">
        
        {/* ── Hero Center Header Block ── */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Hardware-Anchored Attendance Infrastructure</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-bold text-white tracking-tight leading-[1.14]">
            The #1 Biometric Attendance System <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">
              locked to physical company hardware.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate proxy check-ins, mobile GPS mock spoofing, and unmonitored break leaks.
            TimeLogic binds attendance strictly to authorized on-premise kiosk terminals with sub-second facial verification and verified Excel payroll reconciliation.
          </p>

          {/* Clean Action Buttons (No AI slop forms) */}
          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all active:scale-[0.98]"
            >
              <span>View Plans & Pricing</span>
              <ArrowRight size={14} />
            </a>

            <a
              href="https://wa.me/2349113380364?text=Hello%20TimeLogic%20Team%2C%20we%20want%20to%20deploy%20TimeLogic%20on-premise%20attendance."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-medium text-slate-200 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <span>Chat with Deployment Lead</span>
              <span className="text-xs font-mono text-emerald-400">● 24h SLA</span>
            </a>
          </div>

          {/* Verified Specs */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-sky-400" />
              Sub-second facial match
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-sky-400" />
              Zero hardware lock-in
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-sky-400" />
              1-Click Excel export
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-sky-400" />
              Server-clock sync
            </span>
          </div>
        </div>

        {/* ── Animated Workflow Circuit Flow (Radial Arc Pipeline) ── */}
        <div className="pt-8 sm:pt-12">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E121B] p-5 sm:p-7 shadow-xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-sky-300">
                  On-Premise Verification Sequence
                </span>
                <span className="text-[11px] font-mono text-slate-400">· 5 Operational Stages</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Zap size={13} className="text-amber-400" />
                <span>Click any stage to inspect execution details</span>
              </div>
            </div>

            {/* Connecting Circuit Flow Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
              {workflowStages.map((stage, idx) => {
                const isSelected = activeStage === idx;
                const IconComponent = stage.icon;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className={`text-left rounded-xl p-4 transition-all duration-200 relative group cursor-pointer border ${
                      isSelected
                        ? "bg-[#181F2E] border-sky-400/50 shadow-md"
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-sky-300" : "text-slate-400"}`}>
                        {stage.step}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        isSelected 
                          ? "bg-sky-500/20 text-sky-300 border-sky-400/30" 
                          : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                      }`}>
                        {stage.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "bg-white/[0.06] text-slate-300 group-hover:text-white"
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
                        {stage.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {stage.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Deep-Dive Telemetry Card */}
            <div className="mt-5 pt-4 sm:pt-5 border-t border-white/[0.06] bg-[#090B10] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    STAGE {activeStage + 1} OF 5:
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {workflowStages[activeStage].title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {workflowStages[activeStage].description}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="px-3.5 py-1.5 rounded-lg bg-sky-950/50 border border-sky-400/25 text-xs font-mono text-sky-300 flex items-center gap-2">
                  <Sparkles size={13} className="text-sky-400" />
                  <span>{workflowStages[activeStage].detailMetric}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
