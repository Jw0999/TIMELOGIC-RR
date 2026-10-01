"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function SolutionPage() {
  const architectures = [
    {
      id: "kiosk-station",
      number: "PROTOCOL 01",
      title: "On-Premise Kiosk Authorization & Device Binding",
      category: "Terminal Cryptography",
      lead:
        "Conventional mobile attendance apps rely on GPS coordinates that employees easily spoof using mock location apps from their beds. TimeLogic eliminates this by anchoring attendance strictly to physical hardware stationed on your verified premises.",
      points: [
        "Cryptographic device credentials preventing rogue off-site devices from connecting.",
        "Zero GPS vulnerability: punches only validate when physically executed at the authorized station.",
        "Server-clock synchronization blocks employees from manipulating computer time.",
        "Active session schedules prevent punches outside authorized organizational hours.",
      ],
      image: "/screenshots/workforce-checkin.png",
      caption: "Workforce Check-In Station and Administrator Device Authorization Portal",
    },
    {
      id: "face-biometrics",
      number: "PROTOCOL 02",
      title: "One-Time Facial Biometric Enrollment & Template Lock",
      category: "Biometric Identity Engine",
      lead:
        "Buddy-punching and proxy clock-ins cost companies billions annually. TimeLogic's Attendance Station incorporates an intelligent, guided facial enrollment portal. Once enrolled, the employee's face geometry is cryptographically locked to their employee ID for all future check-ins.",
      points: [
        "One-time permanent registration irreversibly binds facial geometry to employee code.",
        "Automated on-device oval frame guidance ensures sharp biometric image capture.",
        "Eliminates proxy punches: using coworker photos, masks, or borrowed IDs is rejected.",
        "Sub-second on-premise facial match during live daily workforce check-ins.",
      ],
      image: "/face.png",
      caption: "TimeLogic Attendance Station: Guided One-Time Facial Biometric Enrollment & Lock",
    },
    {
      id: "live-dashboard",
      number: "PROTOCOL 03",
      title: "Real-Time Executive Attendance Intelligence",
      category: "Command Center",
      lead:
        "Most management teams only discover attendance discrepancies weeks later during payroll calculation. TimeLogic provides live visibility into work-floor presence the exact second an employee clocks in or steps out.",
      points: [
        "Live presence percentage calculated instantly across all active departments.",
        "Visual breakdown differentiating present, late arrivals, excused leaves, and unexcused absences.",
        "Direct drill-down into individual shift logs and punch history.",
        "Immediate detection of delayed shift starts and low-staffing bottlenecks.",
      ],
      image: "/screenshots/admin-dashboard.png",
      caption: "TimeLogic Executive Command Center with live presence ratios and session monitoring",
    },
    {
      id: "fraud-engine",
      number: "PROTOCOL 04",
      title: "Automated Fraud Detection & Anomaly Auditing",
      category: "Security Auditing",
      lead:
        "Time theft and buddy-punching rarely happen in the open. TimeLogic's automated anomaly engine runs continuous background audits to detect suspicious patterns and policy violations automatically.",
      points: [
        "Automatic detection and flagging of overstayed break allowances.",
        "Second-accurate timestamps and tamper detection logging.",
        "Structured HR dispute workflow with administrative investigation notes.",
        "Zero deleted records: an immutable historical ledger for labor compliance.",
      ],
      image: "/screenshots/fraud-alerts.png",
      caption: "Automated Fraud Alerts Engine displaying incident severity, timestamps, and resolution notes",
    },
    {
      id: "break-tracking",
      number: "PROTOCOL 05",
      title: "Granular Break Management & Floor Presence",
      category: "Policy Enforcement",
      lead:
        "Unmonitored breaks silently erode productivity. TimeLogic introduces transparent break tracking categorized by company policy, giving supervisors real-time visibility into who is currently at their desk versus stepping out.",
      points: [
        "Categorized break allowance windows (Lunch, Short Break, Prayer, Nursing).",
        "Allowed duration enforcement (e.g. 60-minute daily lunch window).",
        "Live floor presence toggle for on-site managers to track active workers.",
        "Accurate record of break start time, return time, and total duration.",
      ],
      image: "/screenshots/break-records.png",
      secondaryImage: "/screenshots/break-room-monitor.png",
      caption: "Break Records History and Live Floor Break Room Status Monitor",
    },
    {
      id: "apprentice-tracking",
      number: "PROTOCOL 06",
      title: "Student & Apprentice Cohort Attendance",
      category: "Cohort Management",
      lead:
        "Vocational training programs, technical workshops, and schools face unique challenges tracking apprentice cohorts across different classes and practical training modules.",
      points: [
        "Class and group cohort segmentation with assigned student IDs (e.g. STU001).",
        "Automated in/out recording with daily completion badges.",
        "Supervisor manual override controls for field work and excused absences.",
        "Complete historical record per student for accreditation and grading.",
      ],
      image: "/screenshots/student-attendance.png",
      caption: "Cohort Management Module for apprentice groups and technical training programs",
    },
    {
      id: "payroll-reporting",
      number: "PROTOCOL 07",
      title: "One-Click Payroll-Ready Analytics & Exports",
      category: "Payroll Acceleration",
      lead:
        "Eliminate the painful 3-day ritual of compiling punch cards and manual paper sheets at the end of every month. TimeLogic automatically collates all attendance data into payroll-ready spreadsheets.",
      points: [
        "1-click export to Microsoft Excel (.xlsx) and standard CSV format.",
        "Monthly aggregated summaries: total present, total late, total absent, average work hours.",
        "Departmental punctuality benchmarking and performance comparisons.",
        "Zero mathematical errors in overtime and penalty calculations.",
      ],
      image: "/screenshots/reports-analytics.png",
      caption: "Reports & Analytics Module with live metrics and one-click Excel/CSV export options",
    },
  ];

  const technicalSpecs = [
    { label: "Biometric Inference Latency", value: "<800 ms", note: "Local on-device face match" },
    { label: "Server Clock Drift Tolerance", value: "0 seconds", note: "NTP server lock enforced" },
    { label: "Hardware Support", value: "Agnostic", note: "Windows, Linux, macOS, Android" },
    { label: "Data Integrity Ledger", value: "Immutable", note: "Append-only audit trail" },
  ];

  return (
    <div className="min-h-screen w-full theme-page-bg transition-colors flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO HEADER ── */}
      <section className="pt-16 sm:pt-20 pb-16 theme-page-bg border-b border-theme bg-grid-pattern transition-colors">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/20 text-xs font-mono font-medium text-blue-700 dark:text-sky-300">
            System Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold theme-text-primary tracking-tight leading-tight">
            How TimeLogic Solves Workplace Attendance Fraud
          </h1>

          <p className="theme-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            A comprehensive architectural breakdown of our hardware-bound kiosk terminals, facial biometric locks, live executive command center, automated fraud engine, and instant payroll analytics.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: TECHNICAL PARAMETERS STRIP ── */}
      <section className="py-8 theme-section-bg border-b border-theme transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalSpecs.map((spec) => (
              <div key={spec.label} className="p-4 rounded-lg theme-card-bg border border-theme shadow-xs">
                <div className="text-xl sm:text-2xl font-mono font-bold theme-text-primary">
                  {spec.value}
                </div>
                <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 mt-1">
                  {spec.label}
                </div>
                <div className="text-[11px] theme-text-muted mt-0.5">
                  {spec.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ARCHITECTURAL PROTOCOLS ── */}
      <section className="py-20 sm:py-24 theme-page-bg border-b border-theme transition-colors">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-24">
          {architectures.map((arch) => (
            <div
              key={arch.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
            >
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-sky-400">
                  <span>{arch.number}</span>
                  <span>•</span>
                  <span>{arch.category}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold theme-text-primary tracking-tight">
                  {arch.title}
                </h2>

                <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed">
                  {arch.lead}
                </p>

                <div className="pt-2 space-y-2.5">
                  <div className="text-xs font-bold theme-text-primary uppercase tracking-wider">
                    Key Architectural Guarantees:
                  </div>
                  {arch.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs theme-text-secondary">
                      <CheckCircle2 size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <div className="rounded-xl border border-theme theme-card-bg shadow-xl overflow-hidden">
                  <div className="h-8 px-4 bg-slate-100 dark:bg-[#080d1e] border-b border-theme flex items-center justify-between text-xs theme-text-secondary">
                    <span className="font-mono text-[11px]">timelogic.app / {arch.id}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Verified Capture</span>
                  </div>
                  <img
                    src={arch.image}
                    alt={arch.caption}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {arch.secondaryImage && (
                  <div className="rounded-xl border border-theme theme-card-bg overflow-hidden shadow-md">
                    <img
                      src={arch.secondaryImage}
                      alt={`${arch.caption} supplementary view`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                <div className="text-[11px] theme-text-muted italic">
                  {arch.caption}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: BOTTOM CTA ── */}
      <section className="py-20 sm:py-24 theme-section-bg transition-colors">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold theme-text-primary tracking-tight">
            Ready to deploy TimeLogic in your facility?
          </h2>
          <p className="theme-text-secondary text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Contact our engineering team today to review your on-premise network setup and launch your first kiosk station within 24 hours.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="https://wa.me/2349113380364"
              icon={<MessageSquare size={15} />}
              className="font-semibold shadow-xs text-xs sm:text-sm"
            >
              Chat with Deployment Team
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/pricing"
              className="text-xs sm:text-sm theme-text-primary border-theme hover:bg-slate-100 dark:hover:bg-white/10"
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
