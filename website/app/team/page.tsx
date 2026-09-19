import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { PhoneCall, ShieldCheck, Cpu, Code2, ArrowLeft } from "lucide-react";

export default function TeamPage() {
  const principles = [
    {
      icon: ShieldCheck,
      title: "Verifiable Truth Above All",
      description:
        "Attendance records dictate payroll, trust, and organizational fairness. We refuse to compromise on data integrity or build systems that can be easily spoofed.",
    },
    {
      icon: Cpu,
      title: "Pragmatic Hardware Compatibility",
      description:
        "We build software that turns common, off-the-shelf office tablets and computers into enterprise-grade kiosk stations without forcing clients into proprietary hardware lock-in.",
    },
    {
      icon: Code2,
      title: "Relentless Security Engineering",
      description:
        "From server-clock synchronization to cryptographic device tokens, our backend engineers treat workforce auditing with the same rigor as financial ledgers.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO (WHITE BG) ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            Our People & Philosophy
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            The Team Behind TimeLogic
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Software engineers, operational architects, and security researchers on a mission to eliminate attendance fraud and establish transparent workplace accountability.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: STATEMENT & COMING SOON (BLUE BG) ── */}
      <section className="py-20 sm:py-28 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="p-8 sm:p-14 rounded-2xl bg-[#0f1f4e] border border-blue-400/20 text-center space-y-6 shadow-xl">
            <div className="inline-block px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-300 text-xs font-semibold">
              Leadership & Engineering Roster
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-xl mx-auto">
              Full Executive & Engineering Profiles Coming Soon
            </h2>

            <p className="text-sm sm:text-base text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              We are currently profiling our core engineering, product security, and operations teams as we expand our on-premise deployments across West Africa and international markets.
            </p>

            <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="primary"
                size="md"
                href="tel:09036627043"
                icon={<PhoneCall size={15} />}
                className="shadow-md hover:shadow-lg"
              >
                Speak Directly with Leadership (09036627043)
              </Button>
              <Button
                variant="outline"
                size="md"
                href="/"
                icon={<ArrowLeft size={15} />}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: GUIDING PRINCIPLES (WHITE BG) ── */}
      <section className="py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Our Core Tenets
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              How our engineering team approaches product development
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {principles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
                    <Icon size={20} />
                  </div>
                  <h4 className="text-base font-bold text-slate-950 tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
