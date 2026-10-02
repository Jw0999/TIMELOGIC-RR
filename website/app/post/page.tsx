"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function PostPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All 9 Screens" },
    { id: "kiosk", label: "Kiosk & Biometrics" },
    { id: "oversight", label: "Executive Oversight" },
    { id: "compliance", label: "Compliance & Payroll" },
  ];

  const screens = [
    {
      id: "station-kiosk-login",
      category: "kiosk",
      number: "01",
      heading: "Attendance Kiosk Station: Secure Device Authentication",
      module: "Terminal Gateway",
      image: "/screenshots/station-kiosk-login.png",
      summary:
        "The gateway that authenticates any computer or tablet as an authorized on-premise attendance terminal. Restricts attendance logging strictly to company-approved hardware tied to your verified network.",
      keyCapabilities: [
        "Cryptographic device credentials preventing rogue off-site logins.",
        "Direct clock synchronization with organization server time.",
        "Prevents proxy clock-ins by requiring administrator or employee authorization.",
        "Locks kiosk terminals to authorized on-premise locations.",
      ],
    },
    {
      id: "workforce-checkin",
      category: "kiosk",
      number: "02",
      heading: "Workforce Check-In: Biometric & PIN Attendance Portal",
      module: "Kiosk Touch Interface",
      image: "/screenshots/workforce-checkin.png",
      summary:
        "The primary employee-facing check-in screen. Staff punch in with under 3 seconds per transaction using their authorized employee credentials and facial biometric verification.",
      keyCapabilities: [
        "Displays current active session schedule (e.g. Main Office 07:20 – 19:30).",
        "Tracks total organization staff and live clock-in counts.",
        "Live biometric facial verification status indicator (e.g. 6/9 enrolled).",
        "Instant confirmation feedback with zero duplicate punches.",
      ],
    },
    {
      id: "face-biometrics-enrollment",
      category: "kiosk",
      number: "03",
      heading: "Facial Biometric Enrollment: One-Time Permanent Lock",
      module: "Biometric Identity Engine",
      image: "/face.png",
      summary:
        "The dedicated biometric registration terminal used to enroll and permanently bind an employee's facial geometry to their unique employee ID. Once captured within the guided oval alignment frame, the template is locked, preventing impersonation.",
      keyCapabilities: [
        "Guided oval alignment overlay with live camera positioning feedback.",
        "Permanent cryptographic locking of face template to employee ID.",
        "Eliminates proxy punches and buddy check-ins with tamper-resistant validation.",
        "Sub-second local facial match during daily workforce check-in sessions.",
      ],
    },
    {
      id: "admin-dashboard",
      category: "oversight",
      number: "04",
      heading: "Admin Dashboard: Real-Time Operational Command Center",
      module: "Executive Oversight",
      image: "/screenshots/admin-dashboard.png",
      summary:
        "The central operational interface for organizational administrators. Provides second-by-second visibility into workforce presence rates, active shift sessions, late arrivals, excused leaves, and incoming policy violation alerts.",
      keyCapabilities: [
        "Live presence percentage computed automatically across active personnel.",
        "Visual attendance breakdown differentiating present, late, absent, and on-leave staff.",
        "Integrated live alert feed displaying resolved and open fraud alerts.",
        "Direct navigation to session scheduling, penalties, and break logs.",
      ],
    },
    {
      id: "break-room-live",
      category: "oversight",
      number: "05",
      heading: "Live Floor Presence: Break Room & Active Staff Monitor",
      module: "Floor Management",
      image: "/screenshots/break-room-monitor.png",
      summary:
        "Provides floor managers and supervisors with an instant roster of all present employees and their real-time duty status: whether actively working or currently out on an authorized break.",
      keyCapabilities: [
        "Live toggle between 'Working' and 'Take Break' for present floor staff.",
        "Exact arrival timestamps (e.g., clocked in at 07:57, 08:06).",
        "Department-level visibility into staff availability.",
        "Eliminates unmonitored disappearances from work stations.",
      ],
    },
    {
      id: "fraud-alerts",
      category: "oversight",
      number: "06",
      heading: "Fraud Alerts Engine: Automated Policy Violation Tracking",
      module: "Security Auditing",
      image: "/screenshots/fraud-alerts.png",
      summary:
        "The automated intelligence layer that detects time theft and policy breaches. Any employee who overstays their break or attempts an unverified punch triggers an immediate alert with structured resolution workflows.",
      keyCapabilities: [
        "Severity tag and violation category (e.g., HIGH · OVERSTAYED BREAK).",
        "Second-accurate timestamp and system explanation log.",
        "Structured HR resolution lifecycle (New, Investigating, Resolved, Dismissed).",
        "Permanent audit trail with supervisor notes for labor compliance.",
      ],
    },
    {
      id: "break-records",
      category: "compliance",
      number: "07",
      heading: "Break Records: Granular Activity & Window Auditing",
      module: "Policy Auditing",
      image: "/screenshots/break-records.png",
      summary:
        "A detailed audit log of every break taken across the organization. Breaks are categorized by type with allowed time windows and exact duration tracking in minutes.",
      keyCapabilities: [
        "Granular categories: Lunch, Short Break, Prayer, Personal, and Nursing.",
        "Allowed time window enforcement (e.g., 12:00 – 13:00, 15:00 – 16:00).",
        "Exact duration tracking in minutes (e.g. 58m vs 65m).",
        "Automated status classification (Completed vs Overdue/Overstayed).",
      ],
    },
    {
      id: "student-attendance",
      category: "compliance",
      number: "08",
      heading: "Students & Apprentices: Cohort Attendance Management",
      module: "Cohort Roster",
      image: "/screenshots/student-attendance.png",
      summary:
        "Specialized management portal for training institutes, apprenticeships, and vocational workshops. Groups students by cohort and tracks their daily attendance and completion records.",
      keyCapabilities: [
        "Student tracking codes (e.g., STU002, STU012) and class assignments.",
        "Live daily status tracking with arrival and departure timestamps.",
        "Manual check-in and check-out tools for supervisors.",
        "Cohort filtering by class, group, active status, or name search.",
      ],
    },
    {
      id: "reports-analytics",
      category: "compliance",
      number: "09",
      heading: "Reports & Analytics: One-Click Excel & CSV Exports",
      module: "Payroll Automation",
      image: "/screenshots/reports-analytics.png",
      summary:
        "The automated analytics and reporting engine that compiles raw punch data into monthly performance summaries and direct 1-click Excel/CSV spreadsheets ready for payroll processing.",
      keyCapabilities: [
        "Instant one-click export directly to Microsoft Excel (.xlsx) and CSV.",
        "Monthly aggregated metrics: Total Present, Total Late, and Average Work Hours.",
        "Department performance benchmarks and punctuality rankings.",
        "Eliminates hours of manual payroll calculation and human errors.",
      ],
    },
  ];

  const filteredScreens =
    activeCategory === "all"
      ? screens
      : screens.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen w-full bg-[#090A0F] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO HEADER ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-[#090A0F] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
            System Tour
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Inside TimeLogic: All 9 Production System Interfaces
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Authentic production captures of the TimeLogic platform. Review the operator interfaces, supervisory tools, and automated engines powering our enterprise attendance infrastructure.
          </p>

          {/* Category Filter Tabs */}
          <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-[#0E121B] text-slate-300 border border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SYSTEM SCREENS LIST ── */}
      <section className="py-20 sm:py-24 bg-[#0B0D14] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-20">
          {filteredScreens.map((screen) => (
            <article
              key={screen.id}
              className="p-7 sm:p-9 rounded-xl bg-[#0E121B] border border-white/[0.08] shadow-md space-y-8"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-sky-400">
                  <span className="font-mono font-bold">SCREEN {screen.number}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-semibold text-slate-200">{screen.module}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {screen.heading}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {screen.summary}
                </p>
              </div>

              {/* Framed Window */}
              <div className="rounded-lg border border-white/[0.12] bg-slate-950 shadow-xl overflow-hidden">
                <div className="h-8 px-4 bg-[#090A0F] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono text-[11px]">timelogic.app / {screen.id}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">Production Capture</span>
                </div>
                <img
                  src={screen.image}
                  alt={screen.heading}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Capabilities Grid */}
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  Operational Capabilities:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {screen.keyCapabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: BOTTOM CTA ── */}
      <section className="py-20 sm:py-24 bg-[#090A0F]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Schedule a Live On-Premise Demonstration
          </h2>
          <p className="text-slate-200 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Speak directly with our technical deployment team to see these screens functioning on your company network.
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
