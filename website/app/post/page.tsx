import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { PhoneCall, CheckCircle2 } from "lucide-react";

export default function PostPage() {
  const screens = [
    {
      id: "admin-dashboard",
      heading: "Admin Dashboard: Real-Time Operational Command Center",
      module: "Executive Oversight",
      badge: "Command Center",
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
      id: "station-kiosk-login",
      heading: "Attendance Kiosk Station: Secure Device Authentication",
      module: "Terminal Gateway",
      badge: "Hardware Security",
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
      heading: "Workforce Check-In: Biometric & PIN Attendance Portal",
      module: "Kiosk Touch Interface",
      badge: "Employee Check-In",
      image: "/screenshots/workforce-checkin.png",
      summary:
        "The primary employee-facing check-in screen. Staff punch in with under 3 seconds per transaction using their registered employee credentials and facial biometric verification.",
      keyCapabilities: [
        "Displays current active session schedule (e.g. Main Office 07:20 – 19:30).",
        "Tracks total organization staff and live clock-in counts.",
        "Live biometric facial verification status indicator (e.g. 6/9 enrolled).",
        "Instant confirmation feedback with zero duplicate punches.",
      ],
    },
    {
      id: "break-room-live",
      heading: "Live Floor Presence: Break Room & Active Staff Monitor",
      module: "Floor Management",
      badge: "Live Status",
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
      id: "break-records",
      heading: "Break Records: Granular Activity & Window Auditing",
      module: "Policy Auditing",
      badge: "Compliance",
      image: "/screenshots/break-records.png",
      summary:
        "A detailed audit log of every break taken across the organization. Breaks are categorized by type with allowed time windows and exact duration tracking.",
      keyCapabilities: [
        "Granular categories: Lunch, Short Break, Prayer, Personal, and Nursing.",
        "Allowed time window enforcement (e.g., 12:00 – 13:00, 15:00 – 16:00).",
        "Exact duration tracking in minutes (e.g. 58m vs 65m).",
        "Automated status classification (Completed vs Overdue/Overstayed).",
      ],
    },
    {
      id: "fraud-alerts",
      heading: "Fraud Alerts Engine: Automated Policy Violation Tracking",
      module: "Security Auditing",
      badge: "Anomaly Engine",
      image: "/screenshots/fraud-alerts.png",
      summary:
        "The automated intelligence layer that detects time theft and policy breaches. Any employee who overstays their break or attempts an unverified punch triggers a high-severity alert.",
      keyCapabilities: [
        "Severity tag and violation category (e.g., HIGH · OVERSTAYED BREAK).",
        "Second-accurate timestamp and system explanation log.",
        "Structured HR resolution lifecycle (New, Investigating, Resolved, Dismissed).",
        "Permanent audit trail with supervisor notes for labor compliance.",
      ],
    },
    {
      id: "student-attendance",
      heading: "Students & Apprentices: Cohort Attendance Management",
      module: "Academic & Training",
      badge: "Apprentice Roster",
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
      heading: "Reports & Analytics: One-Click Excel & CSV Exports",
      module: "Payroll Automation",
      badge: "Payroll Reports",
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

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* Hero Header */}
      <section className="pt-16 sm:pt-20 pb-16 border-b border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-300">
            Product Walkthrough & Tour
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Inside TimeLogic: All 8 Production System Screens
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore authentic captures of the TimeLogic platform. Review the user interfaces, administrative tools, and automated engines powering our enterprise attendance infrastructure.
          </p>
        </div>
      </section>

      {/* Screens Showcase */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-24">
          {screens.map((screen, idx) => (
            <article
              key={screen.id}
              className="p-8 sm:p-10 rounded-xl bg-[#0d0f17] border border-white/[0.08] space-y-8"
            >
              {/* Meta & Heading */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono font-bold text-blue-400">
                    SCREEN 0{idx + 1}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-300">{screen.module}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {screen.heading}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {screen.summary}
                </p>
              </div>

              {/* Screenshot Display in Frame */}
              <div className="rounded-xl border border-white/[0.12] bg-[#0c0e14] shadow-xl overflow-hidden">
                <div className="h-8 px-4 bg-[#11141c] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-400">
                    timelogic.app / {screen.id}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">Production Capture</span>
                </div>
                <img
                  src={screen.image}
                  alt={screen.heading}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Capabilities Grid */}
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Operational Capabilities:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {screen.keyCapabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Schedule a Live On-Premise Demonstration
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Speak directly with our technical deployment team to see these screens functioning on your company network.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={15} />}
            >
              Call Deployment Lead: 09036627043
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
