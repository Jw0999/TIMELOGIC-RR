"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ScanFace,
  Clock,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function InteractiveFeatures() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 0,
      title: "Facial Anti-Spoofing & Kiosk Station",
      tag: "Biometric Hardware Lock",
      icon: ScanFace,
      summary:
        "Sub-second facial biometric verification cryptographically bound to your designated physical kiosk computer or tablet.",
      bullets: [
        "Cryptographically anchored to authorized physical workplace terminal",
        "Sub-second face match with 3D anti-spoofing photo detection",
        "Server-locked timestamp precision preventing mock GPS spoofing",
        "Instant fallback to employee PIN for seamless operation",
      ],
      screenshot: "/screenshots/workforce-checkin.png",
      screenshotAlt: "TimeLogic Workforce Check-In Station Interface",
      telemetry: "Terminal #01 Active · 0ms Drift",
      metricLabel: "Scan Speed",
      metricVal: "< 1.2s",
    },
    {
      id: 1,
      title: "Automated Shift Scheduling & Penalties",
      tag: "Policy & Break Engine",
      icon: Clock,
      summary:
        "Autonomous shift rules with configurable start/close windows, grace periods, lunch and prayer break timers, and automatic deduction ledgers.",
      bullets: [
        "Granular break categorization (Lunch, Prayer, Nursing slots)",
        "Second-accurate break timers with automated overstay alarms",
        "Automated lateness penalty calculations and deduction ledger",
        "Flexible multiple-shift definitions per department",
      ],
      screenshot: "/screenshots/break-records.png",
      screenshotAlt: "TimeLogic Granular Break Tracking Interface",
      telemetry: "Break Overstay Detection Active",
      metricLabel: "Time Theft",
      metricVal: "-85%",
    },
    {
      id: 2,
      title: "Live Department Analytics & Audit Logs",
      tag: "Executive Intelligence",
      icon: BarChart3,
      summary:
        "Real-time floor presence dashboard, instant fraud violation alerts, HR dispute investigation workflow, and 1-click Excel export.",
      bullets: [
        "Live presence dashboard tracking who is on-site, on break, or absent",
        "Real-time anomaly ledger highlighting suspicious punch patterns",
        "Direct Microsoft Excel (.xlsx) and CSV export ready for payroll",
        "Departmental punctuality benchmarking and historical audit trails",
      ],
      screenshot: "/screenshots/admin-dashboard.png",
      screenshotAlt: "TimeLogic Executive Attendance Dashboard",
      telemetry: "Live Presence Cluster · Audited",
      metricLabel: "Accuracy",
      metricVal: "99.8%",
    },
  ];

  // Auto-cycle tabs every 6 seconds if not manually interacted with recently
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [features.length]);

  const currentFeature = features[activeTab];
  const CurrentIcon = currentFeature.icon;

  return (
    <section id="features" className="py-20 sm:py-28 bg-[#FFFFFF] text-slate-900 border-y border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-mono font-semibold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Platform Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-950 tracking-tight leading-[1.18]">
            Scale Attendance & Operations{" "}
            <span className="text-blue-600">Automatically</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            TimeLogic replaces vulnerable paper sign-in sheets and easily spoofed mobile GPS apps with on-premise biometric rigor and automated operational intelligence.
          </p>
        </div>

        {/* 2-Column Split: Interactive Tabs on Left, Synchronized Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ── Left Column: 3 Feature Selectors ── */}
          <div className="lg:col-span-5 space-y-3.5">
            {features.map((item, idx) => {
              const isSelected = activeTab === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(idx)}
                  className={`p-5 rounded-2xl transition-all duration-200 cursor-pointer border text-left ${
                    isSelected
                      ? "bg-slate-50/90 border-blue-500/40 shadow-md ring-1 ring-blue-500/20"
                      : "bg-white border-slate-200/70 hover:bg-slate-50/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700">
                      {item.tag}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-blue-600">
                        Active <ChevronRight size={12} />
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  {/* Expanded bullet details if selected */}
                  {isSelected && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-200">
                      {item.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Right Column: Synchronized Preview Mockup Window ── */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-300/80 bg-slate-900 text-white shadow-2xl overflow-hidden">
              
              {/* Window Chrome Titlebar */}
              <div className="h-10 px-4 bg-slate-950 border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 ml-2">
                    TimeLogic OS · {currentFeature.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">
                    {currentFeature.telemetry}
                  </span>
                </div>
              </div>

              {/* Main Screenshot Display */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden group">
                <img
                  key={currentFeature.screenshot}
                  src={currentFeature.screenshot}
                  alt={currentFeature.screenshotAlt}
                  className="w-full h-full object-cover object-top transition-all duration-300 group-hover:scale-[1.01]"
                />

                {/* Floating Metric Badge in corner */}
                <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      {currentFeature.metricLabel}
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {currentFeature.metricVal}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center">
                    <Sparkles size={15} />
                  </div>
                </div>
              </div>

              {/* Window Footer Status Ribbon */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-cyan-400" />
                  <span>Verified Operational Screen</span>
                </div>
                <div className="text-slate-400">
                  TimeLogic On-Premise System UI
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
