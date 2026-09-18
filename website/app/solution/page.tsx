import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  Cpu,
  Activity,
  AlertTriangle,
  Clock,
  GraduationCap,
  FileSpreadsheet,
  PhoneCall,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function SolutionPage() {
  const architectures = [
    {
      id: "kiosk-station",
      number: "01",
      title: "On-Premise Kiosk Authorization & Device Binding",
      category: "Terminal Security",
      lead:
        "Conventional mobile attendance apps rely on GPS coordinates that employees easily spoof using mock location apps from their beds. TimeLogic eliminates this by anchoring attendance strictly to physical hardware stationed on your premises.",
      points: [
        "Cryptographic hardware authentication prevents rogue devices from connecting.",
        "Zero GPS vulnerability: punches only validate when connected to the company network.",
        "Server-clock synchronization blocks employees from changing system time.",
        "Active session schedules prevent punches outside authorized work hours.",
      ],
      image: "/screenshots/workforce-checkin.png",
      secondaryImage: "/screenshots/station-kiosk-login.png",
      caption: "Workforce Check-In Station and Administrator Device Authorization Portal",
    },
    {
      id: "live-dashboard",
      number: "02",
      title: "Real-Time Executive Attendance Intelligence",
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
      number: "03",
      title: "Automated Fraud Detection & Incident Auditing",
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
      number: "04",
      title: "Granular Break Management & Floor Presence",
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
      number: "05",
      title: "Student & Apprentice Cohort Attendance",
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
      number: "06",
      title: "One-Click Payroll-Ready Analytics & Exports",
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

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* Hero Header */}
      <section className="pt-16 sm:pt-20 pb-16 border-b border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-300">
            System Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            How TimeLogic Solves Workplace Attendance Fraud
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A comprehensive breakdown of our hardware-bound kiosk stations, live executive command center, automated fraud engine, and instant payroll analytics.
          </p>
        </div>
      </section>

      {/* Legacy Vulnerabilities vs TimeLogic Reality Table */}
      <section className="py-16 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              The Fundamental Flaws of Alternative Attendance Systems
            </h2>
            <p className="text-sm text-slate-400">
              Why traditional methods fail to provide verifiable attendance data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0f1118] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <XCircle size={16} />
                <span>Paper Logbooks</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trivially forged by colleagues signing signatures for absent friends. Vulnerable to coffee spills, lost pages, and backdated check-in times.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0f1118] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <XCircle size={16} />
                <span>Mobile GPS Apps</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spoofed using common mock-location apps. Workers clock in from their beds while pretending to be at the office. Constant battery and GPS drift disputes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0f1118] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 size={16} />
                <span>TimeLogic Kiosk System</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Attendance is locked to designated on-premise hardware terminals with facial biometrics and server-clock enforcement. Completely un-spoofable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Architectural Walkthrough */}
      <section className="py-20 sm:py-28 space-y-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-24">
          {architectures.map((arch) => (
            <div
              key={arch.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
            >
              {/* Text column */}
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
                  <span>{arch.number} / {arch.category}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {arch.title}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {arch.lead}
                </p>

                <div className="pt-2 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Key Architectural Guarantees:
                  </div>
                  {arch.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media column */}
              <div className="lg:col-span-7 space-y-3">
                <div className="rounded-xl border border-white/[0.12] bg-[#0c0e14] shadow-xl overflow-hidden">
                  <div className="h-8 px-4 bg-[#11141c] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px] text-slate-400">timelogic.app · verified UI</span>
                    <span className="text-[11px] text-emerald-400 font-medium">Production Capture</span>
                  </div>
                  <img
                    src={arch.image}
                    alt={arch.caption}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {arch.secondaryImage && (
                  <div className="rounded-lg border border-white/[0.08] bg-[#0c0e14] overflow-hidden">
                    <img
                      src={arch.secondaryImage}
                      alt={`${arch.caption} supplementary view`}
                      className="w-full h-auto object-cover opacity-90"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-500 italic">
                  Fig {arch.number}: {arch.caption}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to deploy TimeLogic in your facility?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Contact our engineering team today to review your on-premise network setup and launch your first kiosk station.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={15} />}
            >
              Call Deployment Team (09036627043)
            </Button>
            <Button variant="secondary" size="lg" href="/pricing">
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
