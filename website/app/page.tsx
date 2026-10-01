"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  const comparisonRows = [
    {
      feature: "Proxy Clock-In (Buddy-Punching)",
      timelogic: "Impossible: Irreversible facial biometric lock + PIN required",
      paper: "Trivially forged by coworkers signing for absent friends",
      gpsApps: "Frequent: coworkers share phone logins or swap credentials",
    },
    {
      feature: "Location Verification & Spoofing",
      timelogic: "Hardware-bound: punches only valid on authorized on-premise kiosk",
      paper: "Zero verification: sheets can be filled anywhere at any time",
      gpsApps: "Easily bypassed using common Android mock-location GPS apps",
    },
    {
      feature: "Break & Overstay Monitoring",
      timelogic: "Second-accurate tracking with automated overstay alarms",
      paper: "Completely untracked: breaks are never accurately recorded",
      gpsApps: "Manual self-reporting only: workers rarely clock out for breaks",
    },
    {
      feature: "Hardware Requirements & Cost",
      timelogic: "Zero proprietary lock-in: runs on any standard office PC, laptop, or tablet",
      paper: "Low initial cost, massive ongoing losses from time theft & ghost workers",
      gpsApps: "Requires employee personal phones (battery drain & privacy friction)",
    },
    {
      feature: "Payroll Export & Reconciliation",
      timelogic: "1-Click verified export directly to Microsoft Excel (.xlsx) & CSV",
      paper: "3 to 5 days of manual compilation, math errors, and disputes",
      gpsApps: "Basic CSV exports requiring extensive post-processing cleanup",
    },
  ];

  const faqs = [
    {
      q: "What hardware is required to run the TimeLogic Attendance Kiosk?",
      a: "TimeLogic is completely hardware-agnostic. Any desktop computer, laptop, or tablet running Windows, Linux, macOS, or Android with a working front camera and internet connection can be paired as an authorized on-premise kiosk station in under 10 minutes.",
    },
    {
      q: "How does TimeLogic prevent workers from spoofing check-ins with mock location apps?",
      a: "Unlike mobile-first attendance apps that depend on phone GPS signals that employees easily spoof with mock-location utilities, TimeLogic anchors attendance strictly to your physical hardware terminal and verified company network.",
    },
    {
      q: "Can we configure multiple shifts, grace periods, and break windows?",
      a: "Yes. Shift start times, closing times, grace periods, late penalty thresholds, and break durations (such as lunch or prayer slots) are fully configurable per department or organization.",
    },
    {
      q: "How quickly can TimeLogic be deployed in our organization?",
      a: "Standard deployment takes less than 24 hours. Our technical team assists with account setup, kiosk pairing, and employee roster import directly over WhatsApp or on-site.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-white flex flex-col justify-between">
      {/* ── HEADER & HERO ── */}
      <Header />
      <Hero />

      {/* ── SECTION 2: THREE-STAGE OPERATIONAL ARCHITECTURE ── */}
      <section className="py-20 sm:py-24 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-14">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-400/30 text-xs font-mono font-medium text-sky-300">
              Operational Sequence
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              How TimeLogic establishes tamper-proof attendance in three steps.
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Engineered from first principles to eliminate the structural vulnerabilities found in paper logbooks, optical fingerprint scanners, and mobile GPS check-in apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">STAGE 01</span>
                  <span className="text-[11px] font-mono text-slate-300">ON-PREMISE PAIRING</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Designate Kiosk Station
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Authenticate any standard office computer or tablet as an authorized company kiosk. The station cryptographically binds to your physical network and server clock.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-300 space-y-1.5 font-mono">
                <div>• Zero mobile GPS spoofing</div>
                <div>• Server-locked timestamp precision</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">STAGE 02</span>
                  <span className="text-[11px] font-mono text-slate-300">BIOMETRIC PUNCH</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Facial & PIN Verification
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Employees step up to the kiosk, enter their unique employee PIN, and verify identity via sub-second facial match. Transactions execute in under 3 seconds.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-300 space-y-1.5 font-mono">
                <div>• Permanent face template lock</div>
                <div>• Zero proxy check-ins or buddy punches</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-xl bg-[#0b142c] border border-white/[0.08] shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">STAGE 03</span>
                  <span className="text-[11px] font-mono text-slate-300">AUDIT & PAYROLL</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Live Audit & Excel Export
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Supervisors monitor live floor presence and break overstay alarms in real time. At the end of the month, export mathematically verified Excel spreadsheets ready for payroll.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08] text-xs text-slate-300 space-y-1.5 font-mono">
                <div>• 1-Click Excel (.xlsx) / CSV export</div>
                <div>• Automatic overtime & penalty ledger</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ARCHITECTURAL COMPARISON MATRIX ── */}
      <section className="py-20 sm:py-24 bg-[#070d1e] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-400/30 text-xs font-mono font-medium text-sky-300">
              Technical Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Why Alternative Attendance Methods Fail In Practice
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Paper books and mobile GPS apps create operational vulnerabilities that silently leak thousands of dollars in unverified payroll each month.
            </p>
          </div>

          {/* Structured Table */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0b142c] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#080d1e] text-white font-semibold">
                    <th className="py-4 px-5 sm:px-6 w-1/4">Operational Capability</th>
                    <th className="py-4 px-5 sm:px-6 w-1/3 text-sky-400 bg-blue-950/40">
                      TimeLogic Biometric Kiosk
                    </th>
                    <th className="py-4 px-4 text-slate-300 hidden lg:table-cell">Paper Logbooks</th>
                    <th className="py-4 px-4 text-slate-300">Mobile GPS Apps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-200">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 sm:px-6 font-medium text-white">
                        {row.feature}
                      </td>
                      <td className="py-4 px-5 sm:px-6 bg-blue-950/20 font-medium text-sky-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-sky-400 flex-shrink-0 mt-0.5" />
                          <span>{row.timelogic}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 hidden lg:table-cell">
                        <div className="flex items-start gap-2">
                          <XCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{row.paper}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-start gap-2">
                          <XCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{row.gpsApps}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: REAL PRODUCTION MODULES & SCREENSHOT SHOWCASE ── */}
      <section className="py-20 sm:py-24 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-400/30 text-xs font-mono font-medium text-sky-300">
                Production System Modules
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Authentic Interfaces Engineered For Operational Rigor
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                Take a look at the actual software screens utilized daily by administrative leads, supervisors, and floor workers.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              href="/post"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              className="text-xs text-white border-white/20 hover:bg-white/10"
            >
              Explore All 9 System Screens
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Module 1: Workforce Check-In Station */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0b142c] overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="p-6 sm:p-7 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-400">TERMINAL UI · SCREEN 03</div>
                <h3 className="text-lg font-bold text-white">Workforce Check-In Station</h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  The primary staff check-in station. Displays active shift schedules, enrollment counters, and biometric confirmation in under 3 seconds.
                </p>
              </div>
              <div className="border-t border-white/[0.08] bg-slate-950 p-3 sm:p-4">
                <img
                  src="/screenshots/workforce-checkin.png"
                  alt="Workforce Check-In Interface"
                  className="rounded-lg border border-white/[0.08] w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Module 2: Automated Fraud Alerts Engine */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0b142c] overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="p-6 sm:p-7 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-400">ANOMALY ENGINE · SCREEN 07</div>
                <h3 className="text-lg font-bold text-white">Automated Policy Violation Engine</h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Real-time detection ledger that flags overstayed break allowances, suspicious punch timestamps, and policy infractions with resolution workflows.
                </p>
              </div>
              <div className="border-t border-white/[0.08] bg-slate-950 p-3 sm:p-4">
                <img
                  src="/screenshots/fraud-alerts.png"
                  alt="Fraud Alerts Engine"
                  className="rounded-lg border border-white/[0.08] w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: REAL DEPLOYMENT FAQS ── */}
      <section className="py-20 sm:py-24 bg-[#070d1e] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-400/30 text-xs font-mono font-medium text-sky-300">
              Technical FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Deployment & Hardware Specifications
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Concrete operational details regarding TimeLogic on-premise installation and licensing.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-2 shadow-sm"
              >
                <div className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-white">
                  <HelpCircle size={18} className="text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: CONSULTATION & DEPLOYMENT BANNER ── */}
      <section className="py-20 sm:py-24 bg-[#091124]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-blue-500/15 border border-blue-400/30 text-xs font-medium text-sky-300">
            <ShieldCheck size={14} className="text-sky-400" />
            <span>24-Hour Deployment Guarantee</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to secure your organization's attendance?
          </h2>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Our deployment engineers assist with kiosk hardware pairing, staff enrollment, and admin configuration within 24 hours.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="https://wa.me/2349113380364"
              icon={<MessageSquare size={15} />}
              className="font-semibold shadow-xs text-xs sm:text-sm"
            >
              Chat with Deployment Lead
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/pricing"
              className="text-xs sm:text-sm text-white border-white/20 hover:bg-white/10"
            >
              View Monthly Plans
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
