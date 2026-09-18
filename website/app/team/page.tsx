import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Users, PhoneCall, ShieldCheck, Cpu, Code2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen w-full bg-[#08090d] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* Hero Header */}
      <section className="pt-16 sm:pt-20 pb-16 border-b border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-300">
            Our People & Philosophy
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            The Team Behind TimeLogic
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Software engineers, operational architects, and security researchers on a mission to eliminate attendance fraud and establish transparent workplace accountability.
          </p>
        </div>
      </section>

      {/* Main Mission & Coming Soon Area */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-16">
          {/* Statement box */}
          <div className="p-8 sm:p-12 rounded-xl bg-[#0d0f17] border border-white/[0.08] text-center space-y-6">
            <div className="inline-block px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              Leadership & Engineering Roster
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-xl mx-auto">
              Full Executive & Engineering Profiles Coming Soon
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We are currently profiling our core engineering, product security, and operations teams as we expand our on-premise deployments across West Africa and international markets.
            </p>

            <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="primary"
                size="md"
                href="tel:09036627043"
                icon={<PhoneCall size={14} />}
              >
                Speak Directly with Leadership (09036627043)
              </Button>
              <Button
                variant="secondary"
                size="md"
                href="/"
                icon={<ArrowLeft size={14} />}
              >
                Return to Home
              </Button>
            </div>
          </div>

          {/* Guiding Principles */}
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Our Core Tenets
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                How our engineering team approaches product development
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {principles.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-xl bg-[#0f1118] border border-white/[0.08] space-y-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Icon size={18} />
                    </div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
