import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  PhoneCall,
  Lock,
  Globe2,
  DollarSign,
  ShieldCheck,
  Quote,
} from "lucide-react";

export default function InvestorsPage() {
  const investmentQuotes = [
    {
      quote:
        "The most defensible software companies solve deep operational leaks where removing the tool would immediately compromise company revenue or payroll integrity.",
      attribution: "B2B Software Investment Principle",
    },
    {
      quote:
        "Time theft, buddy-punching, and ghost workers drain an estimated 4.5 hours per employee each week in unverified operations—representing hundreds of billions in annual global enterprise losses.",
      attribution: "Global Workforce Economics Research",
    },
    {
      quote:
        "When an attendance platform becomes the trusted record for biometric check-in and payroll calculation, customer churn drops to near zero.",
      attribution: "Enterprise SaaS Retention Dynamics",
    },
  ];

  const marketMetrics = [
    {
      label: "Global Workforce Fraud Cost",
      value: "$400B+",
      description: "Annual losses attributed to unverified attendance and buddy-punching across enterprises.",
    },
    {
      label: "SME & Enterprise Target",
      value: "Millions",
      description: "Offices, clinics, schools, and factories still relying on manual paper logbooks.",
    },
    {
      label: "Gross Margin Profile",
      value: "80%+",
      description: "High-margin cloud SaaS with standard off-the-shelf hardware compatibility.",
    },
    {
      label: "Churn Resistance",
      value: "Mission-Critical",
      description: "Direct tie-in to monthly payroll computation makes replacement highly disruptive.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO HEADER (WHITE BG) ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            Capital & Strategic Partnerships
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Invest in TimeLogic
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Building the foundational infrastructure for verified workplace presence and tamper-proof payroll data across emerging and established commercial markets.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="mailto:invest@timelogic.app?subject=Investment%20Inquiry%20-%20TimeLogic"
              icon={<Mail size={15} />}
              className="shadow-md hover:shadow-lg"
            >
              Email Us: invest@timelogic.app
            </Button>
            <Button
              variant="outline"
              size="md"
              href="tel:09036627043"
              icon={<PhoneCall size={15} />}
              className="text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950"
            >
              Direct Line: 09036627043
            </Button>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: INVESTMENT QUOTES (BLUE BG) ── */}
      <section className="py-20 sm:py-24 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {investmentQuotes.map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-[#0f1f4e] border border-blue-400/20 shadow-lg flex flex-col justify-between space-y-5"
              >
                <Quote className="text-sky-400/70 w-7 h-7" />
                <p className="text-sm text-blue-100/90 italic leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="text-xs font-semibold text-sky-400 border-t border-blue-400/20 pt-4">
                  — {item.attribution}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE THESIS & METRICS (WHITE BG) ── */}
      <section className="py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              The Investment Thesis
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Why TimeLogic Represents A High-Conviction Market Opportunity
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Attendance management in commercial enterprises is broken. TimeLogic captures this high-margin vertical through structural moats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                Defensible Hardware-Bound Verification Moat
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mobile-only attendance apps experience severe customer churn because workers easily bypass GPS restrictions with mock location tools. TimeLogic binds check-in to physical on-premise kiosks, server-locked clocks, and facial biometrics. This creates immutable data integrity that organizations rely on daily.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                <Globe2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                Massive Emerging & Greenfield Market Opportunity
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Across sub-Saharan Africa, Latin America, and Southeast Asia, millions of growing businesses, hospitals, schools, and factories still record attendance with paper books. TimeLogic offers frictionless 24-hour setup using existing office hardware, unlocking vast greenfield ARR.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                <DollarSign size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                High-Margin Predictable B2B SaaS Economics
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Customers subscribe on transparent monthly terms per employee headcount. As businesses hire additional workers or open new branch locations, net retention naturally expands with near-zero marginal cost to serve.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                Immediate Operational ROI For Clients
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                By eliminating buddy-punching, ghost workers, and overstayed breaks, TimeLogic routinely recovers thousands of dollars in payroll leakage in the first 30 days of deployment. The software pays for itself immediately, insulating it from budget cuts.
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {marketMetrics.map((m) => (
              <div key={m.label} className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-3xl font-black text-slate-950 tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-bold text-blue-600 mt-1">
                  {m.label}
                </div>
                <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {m.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: INQUIRY CTA BOX (BLUE BG) ── */}
      <section className="py-22 bg-[#0a1638] text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Request Our Investor Memorandum & Metrics
          </h2>
          <p className="text-blue-100/80 text-base max-w-lg mx-auto leading-relaxed">
            We welcome conversations with qualified angel investors, venture capital funds, and strategic partners interested in workforce infrastructure.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="mailto:invest@timelogic.app?subject=Investment%20Inquiry%20-%20TimeLogic"
              icon={<Mail size={16} />}
              className="shadow-md hover:shadow-lg"
            >
              Email Us: invest@timelogic.app
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={16} />}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Direct Line: 09036627043
            </Button>
          </div>
          <div className="text-xs text-blue-200/60">
            Confidential deck and financial model available upon request.
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
