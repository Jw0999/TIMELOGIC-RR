"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [activeStage, setActiveStage] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/register?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/register");
    }
  };

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
    <section className="relative w-full pt-16 sm:pt-24 pb-20 sm:pb-28 bg-[#07090E] text-white overflow-hidden">
      {/* ── Ambient Glow Lighting & Technical Grid ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(0,229,255,0.13),transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[350px] bg-gradient-to-r from-blue-600/10 via-cyan-500/15 to-blue-600/10 blur-[130px] rounded-full" />
      
      {/* Precision architectural background grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 space-y-10 sm:space-y-14">
        
        {/* ── Hero Center Header Block ── */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-400/30 text-xs font-mono font-medium text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.15)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span>Automated Workforce Intelligence · 100% Tamper-Proof</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.12]">
            Your Entire Workforce & Attendance Management{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
              In One Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate buddy-punching, mobile GPS spoofing, and unmonitored break leaks.
            TimeLogic anchors workforce attendance to authorized physical kiosk hardware with instant facial biometric authentication and verified Excel payroll reconciliation.
          </p>

          {/* Work Email Action Input Box */}
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

          {/* Value Micro-Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-cyan-400" />
              Sub-second facial match
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-cyan-400" />
              Zero hardware lock-in
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-cyan-400" />
              1-Click Excel payroll export
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-cyan-400" />
              24-Hour setup
            </span>
          </div>
        </div>

        {/* ── Animated Workflow Circuit Flow (Radial Arc Pipeline) ── */}
        <div className="pt-8 sm:pt-12">
          <div className="rounded-3xl border border-white/[0.1] bg-[#0A0E1A]/80 backdrop-blur-xl p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Ambient circuit glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-cyan-500/10 blur-[80px]" />
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-cyan-300">
                  Automated Attendance Pipeline
                </span>
                <span className="text-[11px] font-mono text-slate-400">· 5 Live Verified Stages</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Zap size={13} className="text-amber-400" />
                <span>Real-time execution: Click any stage to inspect</span>
              </div>
            </div>

            {/* Connecting Circuit Flow Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
              {workflowStages.map((stage, idx) => {
                const isSelected = activeStage === idx;
                const IconComponent = stage.icon;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className={`text-left rounded-2xl p-4 sm:p-4.5 transition-all duration-300 relative group cursor-pointer border ${
                      isSelected
                        ? "bg-gradient-to-b from-[#131d38] to-[#0d1428] border-cyan-400/50 shadow-[0_0_25px_rgba(0,229,255,0.2)] scale-[1.02]"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]"
                    }`}
                  >
                    {/* Active Tracer Line */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-cyan-300" : "text-slate-400"}`}>
                        {stage.step}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        isSelected 
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30" 
                          : "bg-white/[0.04] text-slate-400 border-white/[0.06]"
                      }`}>
                        {stage.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,229,255,0.4)]" 
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
            <div className="mt-5 pt-4 sm:pt-5 border-t border-white/[0.08] bg-[#060A14]/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
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
                <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-400/25 text-xs font-mono text-cyan-300 flex items-center gap-2">
                  <Sparkles size={13} className="text-cyan-400" />
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
