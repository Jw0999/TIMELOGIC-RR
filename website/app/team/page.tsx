import { Header } from "@/components/Header";
import { Users, PhoneCall, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  return (
    <div className="min-h-screen w-full bg-[#060a16] text-white relative overflow-hidden flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-28 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-amber-300/20 via-orange-400/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-blue-600/20 to-purple-800/15 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-black/30 to-black/75" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Users size={14} />
          <span>Our People</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The Minds Behind <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            TimeLogic
          </span>
        </h1>

        <div className="mt-4 inline-block px-5 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold tracking-wide">
          🚀 Team Profiles Coming Soon
        </div>

        <p className="mt-6 max-w-xl text-slate-300/80 text-base sm:text-lg leading-relaxed">
          We are assembling and profiling our world-class engineering, security, and operational team dedicated to ending workplace attendance fraud and empowering honest enterprise teams.
        </p>

        <div className="mt-10 flex items-center gap-4 flex-wrap justify-center">
          <a
            href="tel:09036627043"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-[0_0_24px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
          >
            <PhoneCall size={15} />
            <span>Speak With Leadership (09036627043)</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="relative z-10 w-full py-6 border-t border-white/10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TimeLogic Inc. All rights reserved.
      </footer>
    </div>
  );
}
