import { Header } from "@/components/Header";
import { Check, PhoneCall, Sparkles, Shield, Building2, Zap } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      icon: Zap,
      badge: "Small Teams",
      employees: "20 Employees",
      billing: "Paid per month",
      sentences: [
        "Ideal for small offices, studios, and boutique businesses eliminating buddy punching.",
        "Full access to the dedicated biometric and employee-code Attendance Kiosk Station.",
        "Real-time admin dashboard with live presence tracking and CSV attendance exports.",
      ],
      features: [
        "Up to 20 registered employees",
        "1 Active Kiosk Station Terminal",
        "Biometric facial & employee PIN verification",
        "Live Admin Dashboard with present rates",
        "Standard Fraud Detection Alerts",
        "1-Click CSV attendance report exports",
      ],
      highlighted: false,
    },
    {
      name: "Enterprise",
      icon: Shield,
      badge: "Most Popular",
      employees: "60 Employees",
      billing: "Paid per month",
      sentences: [
        "Built for expanding companies, manufacturing plants, and multi-department teams.",
        "Includes active break monitoring with automated policy enforcement and fraud detection.",
        "Comprehensive department performance metrics and one-click direct Excel payroll exports.",
      ],
      features: [
        "Up to 60 registered employees",
        "Multiple Kiosk Station Terminals",
        "Automated Fraud Detection & Incident Logging",
        "Categorized Break Tracking (Lunch, Prayer, Nursing)",
        "Overstayed break alarms & resolution auditing",
        "Direct Microsoft Excel (.xlsx) payroll export",
        "Department performance rankings",
      ],
      highlighted: true,
    },
    {
      name: "Organisation",
      icon: Building2,
      badge: "Custom Scale",
      employees: "Custom Employees",
      billing: "Paid per month",
      sentences: [
        "Engineered for large enterprises, multi-branch corporations, schools, and institutions.",
        "Supports multi-kiosk terminal networks with dedicated apprentice and student cohorts.",
        "Dedicated enterprise account manager, custom SLA, and 24/7 priority onboarding support.",
      ],
      features: [
        "Unlimited / custom employee capacity",
        "Multi-branch & multi-location kiosk networks",
        "Student & Apprentice cohort tracking portal",
        "Custom shift rules & multi-window break policies",
        "Dedicated account manager & SLA guarantee",
        "Tailored on-premise hardware setup assistance",
        "24/7 priority telephone & on-site support",
      ],
      highlighted: false,
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-14 sm:py-20">
        {/* Title Area */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles size={14} />
            <span>Transparent Monthly Investment</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Predictable Plans Built For{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              High-Integrity Teams
            </span>
          </h1>

          <p className="mt-5 text-slate-300/85 text-base sm:text-lg leading-relaxed">
            Eliminate time-theft and save hundreds of operational hours. Choose the plan that fits your staff size, paid per month.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-4px] ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-[#0e1738] to-[#0a1027] border-2 border-blue-500/60 shadow-[0_0_50px_rgba(37,99,235,0.35)] ring-1 ring-blue-400/30"
                    : "bg-[#090e21]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide uppercase shadow-md">
                    ★ Most Popular Choice
                  </div>
                )}

                <div>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 text-slate-300 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                        <Icon size={16} />
                      </div>
                      <span>{plan.name}</span>
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {plan.badge}
                    </span>
                  </div>

                  {/* Employees & Billing */}
                  <div className="my-6">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {plan.employees}
                    </div>
                    <div className="text-sm font-semibold text-blue-400 mt-1 uppercase tracking-wider">
                      {plan.billing}
                    </div>
                  </div>

                  {/* 3 Brief Sentences */}
                  <div className="space-y-2.5 py-4 border-y border-white/10 my-6">
                    {plan.sentences.map((sentence, sIdx) => (
                      <p
                        key={sIdx}
                        className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal"
                      >
                        • {sentence}
                      </p>
                    ))}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-8">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Everything Included:
                    </span>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call Now Action Button */}
                <div className="pt-4">
                  <a
                    href="tel:09036627043"
                    className={`w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full font-bold text-sm transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-[1.02]"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-[1.02]"
                    }`}
                  >
                    <PhoneCall size={15} />
                    <span>Call Now: 09036627043</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TimeLogic Enterprise Attendance Systems. Call to activate: 09036627043.
      </footer>
    </div>
  );
}
