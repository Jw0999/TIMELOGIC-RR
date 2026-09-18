import { Header } from "@/components/Header";
import {
  TrendingUp,
  Mail,
  PhoneCall,
  ShieldCheck,
  Quote,
  DollarSign,
  Lock,
  Globe2,
  Users,
} from "lucide-react";

export default function InvestorsPage() {
  const quotes = [
    {
      quote:
        "The most resilient software businesses solve painful, everyday operational leaks where eliminating the software would immediately paralyze business integrity.",
      author: "Venture Software Thesis",
    },
    {
      quote:
        "Unverified attendance and buddy-punching cost organizations over $400 Billion globally each year. Companies that solve this with hardware-bound cryptographic truth become permanent enterprise monopolies.",
      author: "Workforce Economics Report",
    },
    {
      quote:
        "Integrity is not an option in workforce management—it is the foundational prerequisite for every profitable enterprise.",
      author: "Enterprise Capital Insights",
    },
  ];

  const metrics = [
    {
      label: "Global Workforce Fraud Problem",
      value: "$400B+",
      description: "Lost globally each year due to manual time theft and ghost workers.",
    },
    {
      label: "Customer Retention Target",
      value: "99.2%",
      description: "Enterprise operational software once embedded is exceptionally sticky.",
    },
    {
      label: "Gross Margins",
      value: "85%+",
      description: "High-margin cloud SaaS infrastructure with scalable kiosk deployment.",
    },
    {
      label: "Deployment Speed",
      value: "< 24 Hrs",
      description: "Rapid on-premise hardware pairing and employee onboarding turnaround.",
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
            <TrendingUp size={14} />
            <span>Investment Opportunity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Invest in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              TimeLogic
            </span>
          </h1>

          <p className="mt-5 text-slate-300/85 text-base sm:text-lg leading-relaxed">
            Building the definitive tamper-proof workforce attendance infrastructure for high-growth enterprises, institutions, and emerging global markets.
          </p>
        </div>

        {/* Investment Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {quotes.map((item, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-2xl bg-[#090e21]/90 border border-white/10 shadow-xl flex flex-col justify-between relative group hover:border-blue-500/40 transition-all"
            >
              <Quote className="text-blue-400/40 w-8 h-8 mb-4 group-hover:text-blue-400 transition-colors" />
              <p className="text-sm sm:text-base text-slate-200 font-medium italic leading-relaxed mb-6">
                "{item.quote}"
              </p>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block border-t border-white/10 pt-4">
                — {item.author}
              </span>
            </div>
          ))}
        </div>

        {/* The Investment Thesis & Explanation */}
        <div className="p-8 sm:p-14 rounded-3xl bg-[#080d22]/90 border border-white/15 shadow-2xl space-y-10 mb-20">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">
              The Investment Thesis
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Why TimeLogic Represents A High-Conviction, Defensible Market Opportunity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-slate-300/90 leading-relaxed">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Unforgiving Hardware-Bound Moat</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Unlike easily manipulated GPS mobile apps that workers spoof from home, TimeLogic anchors verification to physical on-premise hardware stations and biometric facial locks. This creates 100% verified data integrity that companies cannot operate without.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1">
                  <Globe2 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Vast Untapped Frontier Markets</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    In emerging and established business corridors, millions of medium-sized businesses, factories, schools, and offices still tally attendance on manual paper notebooks. TimeLogic replaces this with frictionless cloud intelligence.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Predictable High-Margin Recurring SaaS</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Every organization pays per month with zero hardware lock-in friction. As clients scale headcounts and add new branch locations, expansion revenue naturally compounds with near-zero marginal cost to serve.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-1">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Immediate ROI For Operators</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    By stopping buddy-punching, ghost workers, and overstayed breaks, TimeLogic routinely recovers thousands of dollars in payroll leakage in the very first month, making software renewal a financial no-brainer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Opportunity Metrics */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m) => (
              <div key={m.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-bold text-blue-400 mt-1">
                  {m.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  {m.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Inquiry CTA Box with Email Button */}
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-blue-950/60 via-indigo-950/50 to-purple-950/40 border border-blue-500/40 text-center space-y-8 shadow-[0_0_60px_rgba(37,99,235,0.3)]">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Request Our Investor Pitch Deck & Data Room
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We welcome discussions with strategic angel investors, venture funds, and private equity partners who share our conviction in operational integrity.
            </p>
          </div>

          {/* Email Button & Direct Line */}
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <a
              href="mailto:invest@timelogic.app?subject=Investment%20Inquiry%20-%20TimeLogic"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all hover:scale-105 active:scale-95"
            >
              <Mail size={17} />
              <span>Email Us: invest@timelogic.app</span>
            </a>

            <a
              href="tel:09036627043"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <PhoneCall size={16} className="text-indigo-300 animate-pulse" />
              <span>Direct Line: 09036627043</span>
            </a>
          </div>

          <div className="text-xs text-slate-400">
            Confidential investor memorandum and cap table available upon request.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TimeLogic Inc. Investor Relations. Direct Line: 09036627043.
      </footer>
    </div>
  );
}
