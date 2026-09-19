import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Check, PhoneCall, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      capacity: "20 Employees",
      billing: "Paid monthly",
      description: "Designed for small commercial offices, studios, and single-location businesses eliminating buddy-punching.",
      sentences: [
        "Ideal for boutique offices and studios seeking to eliminate proxy clock-ins.",
        "Full access to the dedicated biometric and employee-code Attendance Kiosk Station.",
        "Real-time admin dashboard with live presence tracking and standard CSV exports.",
      ],
      features: [
        "Up to 20 registered employees",
        "1 Active On-Premise Kiosk Station",
        "Biometric facial & employee PIN verification",
        "Live Executive Presence Dashboard",
        "Standard policy violation alerts",
        "1-Click CSV attendance report exports",
      ],
      ctaText: "Activate Starter Plan",
      highlighted: false,
    },
    {
      name: "Enterprise",
      capacity: "60 Employees",
      billing: "Paid monthly",
      description: "Built for expanding companies, manufacturing plants, and multi-department teams requiring full operational oversight.",
      sentences: [
        "Engineered for multi-department organizations, factories, and commercial facilities.",
        "Full break monitoring with automated policy enforcement and instant overstay alarms.",
        "Comprehensive department performance metrics with direct Microsoft Excel payroll integration.",
      ],
      features: [
        "Up to 60 registered employees",
        "Multi-kiosk terminal support across departments",
        "Automated Fraud Detection & Incident Logging",
        "Granular Break Tracking (Lunch, Prayer, Nursing)",
        "Overstayed break alarms & resolution auditing",
        "Direct Microsoft Excel (.xlsx) payroll export",
        "Departmental punctuality & overtime rankings",
      ],
      ctaText: "Activate Enterprise Plan",
      highlighted: true,
    },
    {
      name: "Organisation",
      capacity: "Custom Employees",
      billing: "Paid monthly / Custom terms",
      description: "Tailored for large multi-branch corporations, educational institutions, and multi-location enterprises.",
      sentences: [
        "Engineered for large enterprises, multi-branch corporations, schools, and institutions.",
        "Supports multi-kiosk terminal networks with dedicated apprentice and student cohorts.",
        "Dedicated enterprise account manager, custom SLA guarantee, and 24/7 priority onboarding support.",
      ],
      features: [
        "Unlimited custom employee capacity",
        "Multi-branch & multi-facility kiosk network",
        "Student & Apprentice cohort tracking portal",
        "Custom shift rules & multi-window break policies",
        "Dedicated enterprise account manager & SLA",
        "On-premise hardware setup and staff enrollment assistance",
        "24/7 priority telephone & on-site technical support",
      ],
      ctaText: "Contact for Custom Deployment",
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: "What hardware is required for an Attendance Kiosk Station?",
      a: "TimeLogic is designed to run on standard office hardware. Any modern desktop computer, laptop, or tablet (Windows, macOS, Linux, or Android) with a front-facing camera can be paired as an authorized on-premise kiosk station in under 10 minutes.",
    },
    {
      q: "How does TimeLogic prevent workers from spoofing check-ins?",
      a: "Unlike mobile apps that rely on easily spoofed GPS signals, TimeLogic pairs with your physical office network and hardware terminal. Check-in requires employee PIN authentication paired with biometric facial verification synced directly with the server clock.",
    },
    {
      q: "Can we support multiple shifts, grace periods, and break windows?",
      a: "Yes. Shift start times, closing times, grace periods, late penalty thresholds, and break durations (such as lunch or prayer slots) are fully configurable per department or organization.",
    },
    {
      q: "How quickly can TimeLogic be deployed in our organization?",
      a: "Standard installations take less than 24 hours. Our technical team assists with account setup, kiosk pairing, and employee roster import directly over the phone or on-site.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HEADER & INTRO (WHITE BG) ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            Deployment & Licensing
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Transparent Monthly Deployment Plans
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Predictable monthly billing based on your verified employee headcount. No hidden hardware lock-in or per-check-in surcharges.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: 3 PRICING CARDS (BLUE BG) ── */}
      <section className="py-20 sm:py-28 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 sm:p-9 flex flex-col justify-between transition-all ${
                  plan.highlighted
                    ? "bg-[#102356] border-2 border-blue-400 shadow-2xl ring-1 ring-blue-300/30"
                    : "bg-[#0c1b40] border border-blue-400/20 shadow-lg"
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500 text-white shadow-xs">
                        Most Popular
                      </span>
                    )}
                  </div>

                  {/* Headcount */}
                  <div className="mt-6 mb-2">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {plan.capacity}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mt-1">
                      {plan.billing}
                    </div>
                  </div>

                  <p className="text-xs text-blue-100/75 leading-relaxed mt-3">
                    {plan.description}
                  </p>

                  {/* 3 Brief Sentences */}
                  <div className="my-6 py-5 border-y border-blue-400/20 space-y-2.5">
                    {plan.sentences.map((sent, sIdx) => (
                      <p key={sIdx} className="text-xs text-blue-100/90 leading-relaxed font-medium">
                        • {sent}
                      </p>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-blue-100/90">
                        <Check size={15} className="text-sky-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Register Button & Direct Call Button */}
                <div className="pt-4 border-t border-blue-400/20 space-y-2.5">
                  <Button
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="md"
                    href={`/register?plan=${plan.name.toLowerCase()}`}
                    className={`w-full justify-center font-bold transition-all ${
                      plan.highlighted
                        ? "bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-md hover:shadow-lg ring-1 ring-sky-300"
                        : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-xs"
                    }`}
                  >
                    Register {plan.name} Plan
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    href="tel:09036627043"
                    icon={<PhoneCall size={13} />}
                    className="w-full justify-center text-xs text-blue-200 border-white/20 hover:bg-white/10"
                  >
                    Call To Deploy: 09036627043
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: OPERATIONAL FAQS (WHITE BG) ── */}
      <section className="py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Frequently Asked Operational Questions
            </h2>
            <p className="text-sm text-slate-600">
              Technical and logistical details regarding TimeLogic on-premise deployments.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-2"
              >
                <div className="text-base font-bold text-slate-950 flex items-center gap-2.5">
                  <HelpCircle size={18} className="text-blue-600 flex-shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
