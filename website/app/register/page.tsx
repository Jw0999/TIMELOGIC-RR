"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  Users,
  Sparkles,
  Lock,
} from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get("email") || "";

  const [orgName, setOrgName] = useState("");
  const [workEmail, setWorkEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [teamSize, setTeamSize] = useState("20-50");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !workEmail.trim()) return;

    // Build WhatsApp message URL
    const text = `Hello TimeLogic Team, I would like to get started with TimeLogic for my organization:\n\n• Organization: ${orgName.trim()}\n• Work Email: ${workEmail.trim()}\n• Phone: ${phone.trim() || "N/A"}\n• Team Size: ${teamSize}\n\nPlease guide us on kiosk pairing and subscription activation.`;
    const waUrl = `https://wa.me/2349113380364?text=${encodeURIComponent(text)}`;

    setSubmitted(true);
    // Direct user to WhatsApp onboarding lead after a brief moment
    setTimeout(() => {
      window.location.href = waUrl;
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      {submitted ? (
        <div className="rounded-3xl border border-cyan-400/40 bg-[#0d152a] p-8 text-center space-y-4 shadow-2xl animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Connecting to TimeLogic Deployment...</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Redirecting to WhatsApp deployment lead with your organization profile. Our technical team will assist with kiosk pairing in under 24 hours.
          </p>
          <div className="pt-2">
            <span className="text-xs font-mono text-cyan-400 animate-pulse">
              Transferring to onboarding queue...
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/[0.12] bg-[#0c1224]/90 backdrop-blur-2xl p-7 sm:p-10 shadow-2xl space-y-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-400/30 text-[11px] font-mono font-medium text-cyan-300">
              <Sparkles size={12} className="text-cyan-400" />
              <span>Instant Deployment Intake</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Get Started with TimeLogic
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pair your office computers or tablets as authorized kiosks in under 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Organization Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Building2 size={13} className="text-cyan-400" />
                <span>Organization / Company Name *</span>
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Apex Specialist Clinics Ltd"
                className="w-full rounded-xl bg-[#070b18] border border-white/[0.1] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Mail size={13} className="text-cyan-400" />
                <span>Work Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full rounded-xl bg-[#070b18] border border-white/[0.1] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
            </div>

            {/* Phone / WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Phone size={13} className="text-cyan-400" />
                <span>Phone / WhatsApp Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full rounded-xl bg-[#070b18] border border-white/[0.1] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
            </div>

            {/* Team Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Users size={13} className="text-cyan-400" />
                <span>Estimated Employee Headcount</span>
              </label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full rounded-xl bg-[#070b18] border border-white/[0.1] px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all cursor-pointer"
              >
                <option value="1-20" className="bg-[#070b18] text-white">Starter Tier: Up to 20 Employees (1 Terminal)</option>
                <option value="20-60" className="bg-[#070b18] text-white">Enterprise Tier: 20 to 60 Employees (Multi-Terminal)</option>
                <option value="60-200" className="bg-[#070b18] text-white">Expansion: 60 to 200 Employees</option>
                <option value="200+" className="bg-[#070b18] text-white">Organisation Tier: 200+ Employees (Multi-Branch)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] active:scale-[0.98]"
            >
              <span>Submit & Deploy with Engineer</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Pricing alternative */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span>Want to review pricing first?</span>
            <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 font-medium">
              View Monthly Plans →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col justify-between">
      <Header />

      <main className="py-16 sm:py-24 px-5 sm:px-6 relative overflow-hidden">
        {/* Ambient lighting */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <Suspense
            fallback={
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                Loading deployment intake...
              </div>
            }
          >
            <RegisterForm />
          </Suspense>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 text-left">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>24-Hour SLA</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Full kiosk hardware pairing and staff roster import in under 24 hours.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Lock size={14} className="text-cyan-400" />
                <span>Hardware Bound</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Runs on standard PC, laptop, or tablet. Zero mobile GPS spoofing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <CheckCircle2 size={14} className="text-cyan-400" />
                <span>Verified Excel</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                1-Click verified payroll export with automatic overstay deductions.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
