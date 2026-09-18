import { Header } from "@/components/Header";
import { PhoneCall, Layers, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function PostPage() {
  const posts = [
    {
      id: "admin-dashboard",
      screenHeading: "Admin Dashboard: Real-Time Operational Command Center",
      category: "System Overview",
      date: "Platform Walkthrough",
      image: "/screenshots/admin-dashboard.png",
      summary:
        "The central nerve center of TimeLogic. Administrators get instant visibility into total employees, present counts, late arrivals, absent personnel, and active working sessions in real time.",
      details: [
        "Live presence rate percentage calculated automatically.",
        "Visual attendance breakdown graphs for quick executive assessment.",
        "Direct stream of incoming fraud alerts requiring administrative review.",
      ],
    },
    {
      id: "station-kiosk-login",
      screenHeading: "Station Kiosk Access: Hardware Authorization Gateway",
      category: "Terminal Security",
      date: "Device Authentication",
      image: "/screenshots/station-kiosk-login.png",
      summary:
        "Ensures attendance can only ever be recorded on authorized, company-approved hardware physically stationed at verified work sites.",
      details: [
        "Cryptographic device and station credentials preventing external spoofing.",
        "Direct synchronization with organization server clock to block time tampering.",
        "Administrator terminal lockout to secure kiosk terminals after hours.",
      ],
    },
    {
      id: "workforce-checkin",
      screenHeading: "Workforce Check-In Kiosk: Biometric & PIN Portal",
      category: "Check-In Experience",
      date: "On-Premise Kiosk",
      image: "/screenshots/workforce-checkin.png",
      summary:
        "The primary employee check-in interface. Staff punch in seamlessly using their registered credentials, PIN, and biometric facial verification.",
      details: [
        "Active session schedules showing shift hours (e.g. Main Office 07:20 – 19:30).",
        "Biometric enrollment status tracking per staff member.",
        "Instant confirmation feedback ensuring zero duplicated punches.",
      ],
    },
    {
      id: "break-room-monitor",
      screenHeading: "Live Floor Presence: Break Room & Active Staff Monitor",
      category: "Floor Monitoring",
      date: "Real-Time Activity",
      image: "/screenshots/break-room-monitor.png",
      summary:
        "Floor supervisors can monitor all clocked-in staff in real time and observe who is currently working versus stepping out on break.",
      details: [
        "Live toggle between 'Working' and 'Take Break' modes for floor staff.",
        "Exact clock-in timestamps displayed per employee.",
        "Immediate detection of unaccounted absences from the work floor.",
      ],
    },
    {
      id: "break-records",
      screenHeading: "Break Records: Granular Activity & Window Auditing",
      category: "Policy Compliance",
      date: "Break Management",
      image: "/screenshots/break-records.png",
      summary:
        "Comprehensive tracking of all employee break sessions categorized by Lunch, Short Break, Prayer, Personal, and Nursing windows.",
      details: [
        "Allowed window enforcement (e.g. 12:00 – 13:00 lunch slot).",
        "Duration audit down to the exact minute (e.g., 58m vs 65m).",
        "Automatic flagging when employees exceed daily allowed break durations.",
      ],
    },
    {
      id: "fraud-alerts",
      screenHeading: "Fraud Alerts: Automated Policy Violation Engine",
      category: "Fraud Prevention",
      date: "Security Engine",
      image: "/screenshots/fraud-alerts.png",
      summary:
        "An intelligent auditing engine that automatically flags anomalies, overstayed breaks, and suspicious check-in patterns with full resolution workflows.",
      details: [
        "High-severity categorization with timestamped system evidence.",
        "Investigation lifecycle: New, Investigating, Resolved, and Dismissed.",
        "Transparent admin resolution notes for labor audit compliance.",
      ],
    },
    {
      id: "student-attendance",
      screenHeading: "Students & Apprentices: Cohort Attendance Management",
      category: "Training & Education",
      date: "Apprentice Tracking",
      image: "/screenshots/student-attendance.png",
      summary:
        "Dedicated cohort tracking built for apprentices, vocational trainees, and students across multiple training streams.",
      details: [
        "Individual student tracking codes (e.g. STU002, STU009) and class assignments.",
        "Live daily status: In time, Out time, and Completion verification.",
        "Manual supervisor check-in and check-out tools for special circumstances.",
      ],
    },
    {
      id: "reports-analytics",
      screenHeading: "Reports & Analytics: One-Click Excel & CSV Exporting",
      category: "Payroll & Reporting",
      date: "Executive Analytics",
      image: "/screenshots/reports-analytics.png",
      summary:
        "Instant monthly summaries and department performance charts with 1-click export to Microsoft Excel (.xlsx) and CSV for payroll processing.",
      details: [
        "Monthly aggregated metrics: Total Present, Total Late, and Average Work Hours.",
        "Departmental performance and punctuality benchmarks.",
        "Eliminates manual HR data entry and dispute-prone paper sheets.",
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#060a16] text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-gradient-to-br from-amber-300/20 via-orange-400/10 to-transparent blur-[150px]" />
      <div className="pointer-events-none fixed top-1/2 right-0 h-[750px] w-[750px] rounded-full bg-gradient-to-tl from-indigo-600/25 via-blue-600/15 to-purple-900/15 blur-[160px]" />
      <div className="pointer-events-none fixed inset-0 bg-radial from-transparent via-black/30 to-black/80" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-14 sm:py-20">
        {/* Title Area */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-5">
            <Layers size={14} />
            <span>Product Walkthrough Posts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Inside The TimeLogic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              System Screens
            </span>
          </h1>

          <p className="mt-5 text-slate-300/85 text-base sm:text-lg leading-relaxed">
            A visual deep-dive into each screen of the TimeLogic platform. Discover how our kiosk stations, live dashboards, fraud engines, and analytics function in daily operations.
          </p>
        </div>

        {/* Posts List */}
        <div className="space-y-20">
          {posts.map((post, idx) => (
            <article
              key={post.id}
              className="p-6 sm:p-10 rounded-3xl bg-[#090e21]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-8 transition-all hover:border-white/20"
            >
              {/* Meta and Heading */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold text-sky-400 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-400/30">
                    {post.category}
                  </span>
                  <span className="text-slate-400">• Screen {idx + 1} of {posts.length}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {post.screenHeading}
                </h2>

                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal max-w-3xl">
                  {post.summary}
                </p>
              </div>

              {/* Full Screenshot Display */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl">
                <img
                  src={post.image}
                  alt={post.screenHeading}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Key Screen Capabilities */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {post.details.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    <span className="text-blue-400 font-bold block mb-1">0{dIdx + 1}. Capability</span>
                    {detail}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Call CTA */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-blue-950/50 to-indigo-950/40 border border-blue-500/30 text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Want to see these screens live in your organization?
          </h3>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            Speak directly with our technical deployment team to arrange an on-premise demonstration.
          </p>
          <a
            href="tel:09036627043"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all hover:scale-105"
          >
            <PhoneCall size={16} />
            <span>Call Deployment Team (09036627043)</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TimeLogic Enterprise Attendance Systems. Direct Line: 09036627043.
      </footer>
    </div>
  );
}
