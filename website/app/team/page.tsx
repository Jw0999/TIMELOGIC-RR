"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Mail, ShieldCheck, Cpu, Code2, ArrowLeft } from "lucide-react";

export default function TeamPage() {
  const principles = [
    {
      icon: ShieldCheck,
      title: "Verifiable Truth Above All",
      description:
        "Attendance records dictate payroll, trust, and organizational fairness. We refuse to compromise on data integrity or build systems that can be bypassed by spoofed location apps.",
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
    <div className="min-h-screen w-full bg-[#090A0F] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HERO ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-[#090A0F] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
            People & Engineering Philosophy
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            The Team Behind TimeLogic
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Software engineers, systems architects, and security researchers dedicated to eliminating attendance fraud and establishing transparent workplace accountability.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: ENGINEERING STATEMENT ── */}
      <section className="py-20 sm:py-24 bg-[#0B0D14] border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="p-8 sm:p-12 rounded-xl bg-[#0E121B] border border-white/[0.08] text-center space-y-6 shadow-md">
            <div className="inline-block px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.1] text-sky-300 text-xs font-mono font-medium">
              Engineering Dispatch
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-xl mx-auto">
              Building Infrastructure For Emerging & Global Enterprises
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We are currently scaling our core engineering, product security, and operations teams as we expand our on-premise deployments across commercial hubs in West Africa and international markets.
            </p>

            <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="primary"
                size="md"
                href="mailto:support@timelogics.tech?subject=Executive%20Inquiry"
                icon={<Mail size={14} />}
                className="text-xs sm:text-sm font-semibold shadow-xs"
              >
                Contact Leadership
              </Button>
              <Button
                variant="outline"
                size="md"
                href="/"
                icon={<ArrowLeft size={14} />}
                className="text-xs sm:text-sm text-white border-white/20 hover:bg-white/10"
              >
                Return to Overview
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: GUIDING PRINCIPLES ── */}
      <section className="py-20 sm:py-24 bg-[#090A0F] border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              Core Tenets
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How our engineering team approaches product development
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-[#0E121B] border border-white/[0.08] space-y-3 shadow-xs"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-sky-300 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
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
