import { Header } from "@/components/Header";
import {
  ShieldCheck,
  Cpu,
  Activity,
  AlertTriangle,
  Clock,
  GraduationCap,
  FileSpreadsheet,
  PhoneCall,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Image from "next/image";

export default function SolutionPage() {
  const solutions = [
    {
      badge: "Kiosk Station Authorization",
      icon: Cpu,
      title: "Tamper-Proof Kiosk Stations & On-Premise Authorization",
      problem:
        "Conventional attendance relies on paper registers or untrusted devices where employees clock in for absent coworkers (buddy punching) or forge punch times.",
      solution:
        "TimeLogic turns any designated on-premise hardware into a cryptographically secured Attendance Kiosk Station. Check-ins are bound strictly to verified organization terminals, synchronizing directly with live server time to eliminate any clock manipulation.",
      highlights: [
        "Hardware-bound kiosk station authentication",
        "Biometric facial validation & unique employee credential checks",
        "Zero time spoofing: locked to organization server clock",
        "Active shift scheduling and automated session boundaries",
      ],
      image: "/screenshots/workforce-checkin.png",
      secondaryImage: "/screenshots/station-kiosk-login.png",
      alt: "Workforce Check-In Kiosk Station",
    },
    {
      badge: "Real-Time Intelligence",
      icon: Activity,
      title: "Live Executive Attendance Intelligence & Command Center",
      problem:
        "Managers operate in the dark, finding out who was absent or late days later when it is too late to adjust floor staffing and operations.",
      solution:
        "The TimeLogic Admin Dashboard streams live workforce activity the moment it happens. Management gets an instant pulse on present rates, late arrivals, on-leave staff, and active operational sessions at a glance.",
      highlights: [
        "Live presence rate calculation updated in real time",
        "Visual attendance breakdown (Present, Late, Absent, On Leave)",
        "Instant drill-down into individual shift records",
        "Department-level staffing indicators",
      ],
      image: "/screenshots/admin-dashboard.png",
      alt: "TimeLogic Live Executive Admin Dashboard",
    },
    {
      badge: "Fraud Detection Engine",
      icon: AlertTriangle,
      title: "Automated Fraud Detection & Second-by-Second Audit Trails",
      problem:
        "Time theft, unauthorized shift extensions, ghost workers, and overstayed breaks silently erode company margins with zero accountability.",
      solution:
        "Our automated Fraud Detection Engine continuously audits check-in and break events. If an employee exceeds allowed break durations or attempts an unauthorized check-in, a high-severity alert is flagged with a second-accurate timestamp and administrative investigation log.",
      highlights: [
        "Automatic detection of overstayed breaks and policy violations",
        "Structured resolution workflows (Investigating, Resolved, Dismissed)",
        "Audit log with admin review notes and timestamps",
        "Full transparent record for HR dispute resolution",
      ],
      image: "/screenshots/fraud-alerts.png",
      alt: "TimeLogic Automated Fraud Detection Engine",
    },
    {
      badge: "Workforce Activity & Floor Tracking",
      icon: Clock,
      title: "Granular Break Management & Live Floor Presence",
      problem:
        "Employees take unmonitored breaks, claim they were only away for 15 minutes when they were gone for an hour, or disappear from their posts.",
      solution:
        "TimeLogic introduces categorized break accounting (Lunch, Short Break, Prayer, Personal, Nursing) with strict allowed time windows. The live break room monitor gives team leaders total visibility into who is currently working versus on break.",
      highlights: [
        "Categorized break policies tailored to company guidelines",
        "Allowed window enforcement (e.g., 60-minute daily allowance)",
        "Live floor presence toggle (Working vs Take Break)",
        "Precise start, end, and total duration tracking",
      ],
      image: "/screenshots/break-records.png",
      secondaryImage: "/screenshots/break-room-monitor.png",
      alt: "TimeLogic Break Records & Live Floor Presence",
    },
    {
      badge: "Education & Apprenticeship",
      icon: GraduationCap,
      title: "Student & Apprentice Cohort Tracking",
      problem:
        "Training institutes, vocational centers, and technical workshops struggle with chaotic sign-in sheets for students, apprentices, and trainees across multiple classes.",
      solution:
        "A specialized module designed for student and apprentice cohorts. Admins can categorize trainees by class or group (e.g. Desktop Publishing, Apprentices), assign unique tracking codes, and record in/out status with manual supervisor overrides.",
      highlights: [
        "Student directory with unique tracking codes (e.g., STU001)",
        "Class and group cohort segmentation",
        "Automated In/Out recording with daily attendance status",
        "Supervisor manual check-in/out override tools",
      ],
      image: "/screenshots/student-attendance.png",
      alt: "Student & Apprentice Attendance Management",
    },
    {
      badge: "Payroll Acceleration",
      icon: FileSpreadsheet,
      title: "One-Click Payroll-Ready Analytics & Export Engine",
      problem:
        "HR and finance personnel spend entire days manually calculating time cards, overtime, and deductions at the end of each month, frequently making costly errors.",
      solution:
        "TimeLogic collates all punches, late arrivals, total hours, and overtime automatically. With a single click, export pristine Excel and CSV reports ready for payroll computation and compliance auditing.",
      highlights: [
        "One-click direct export to Microsoft Excel (.xlsx) and CSV",
        "Monthly summaries: total present, total late, average work hours",
        "Departmental performance and punctuality rankings",
        "Eliminates hours of manual HR data entry every payroll cycle",
      ],
      image: "/screenshots/reports-analytics.png",
      alt: "Reports & Analytics Excel and CSV Exports",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#060a16] text-white relative overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-gradient-to-br from-amber-300/20 via-orange-400/10 to-transparent blur-[150px]" />
      <div className="pointer-events-none fixed top-1/3 right-0 h-[750px] w-[750px] rounded-full bg-gradient-to-tl from-indigo-600/25 via-blue-600/15 to-purple-900/15 blur-[160px]" />
      <div className="pointer-events-none fixed inset-0 bg-radial from-transparent via-black/30 to-black/80" />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-5">
          <ShieldCheck size={14} />
          <span>Enterprise Attendance Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Every Attendance Problem Solved With{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
            Unforgiving Precision
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300/85 leading-relaxed font-normal">
          TimeLogic replaces unreliable punch clocks and paper sign-in books with a tamper-proof kiosk network, automated fraud detection, and instant payroll analytics.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="tel:09036627043"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-[0_0_24px_rgba(37,99,235,0.5)] transition-all hover:scale-105"
          >
            <PhoneCall size={15} />
            <span>Schedule A Live Demo (09036627043)</span>
          </a>
        </div>
      </section>

      {/* Detailed Solutions Breakdown */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-24">
        {solutions.map((item, idx) => {
          const Icon = item.icon;
          const isReversed = idx % 2 === 1;

          return (
            <div
              key={item.title}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center ${
                isReversed ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text Information Column */}
              <div
                className={`lg:col-span-6 space-y-5 ${
                  isReversed ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-sky-400 tracking-wide">
                  <Icon size={13} />
                  <span>{item.badge}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {item.title}
                </h2>

                {/* Problem vs Solution Callout Cards */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                    <strong className="text-rose-400 font-semibold block mb-1">
                      ⚠️ The Problem:
                    </strong>
                    {item.problem}
                  </div>

                  <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <strong className="text-blue-400 font-semibold block mb-1">
                      🛡️ How TimeLogic Solves It:
                    </strong>
                    {item.solution}
                  </div>
                </div>

                {/* Bullet Highlights */}
                <ul className="space-y-2.5 pt-2">
                  {item.highlights.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-emerald-400 flex-shrink-0 mt-0.5"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Screenshots Display Column */}
              <div
                className={`lg:col-span-6 space-y-4 ${
                  isReversed ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] group transition-transform duration-300 hover:scale-[1.01]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Optional secondary screenshot if available */}
                {item.secondaryImage && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-lg group transition-transform duration-300 hover:scale-[1.01]">
                    <img
                      src={item.secondaryImage}
                      alt={`${item.alt} secondary view`}
                      className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-blue-950/50 to-indigo-950/40 border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.25)]">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to secure your workforce attendance?
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            Contact our engineering and deployment team today. We configure and deploy TimeLogic on your premises within 24 hours.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="tel:09036627043"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all hover:scale-105"
            >
              <PhoneCall size={16} />
              <span>Call Now: 09036627043</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TimeLogic Enterprise Attendance Systems. Direct Line: 09036627043.
      </footer>
    </div>
  );
}
