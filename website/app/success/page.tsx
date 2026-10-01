"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Mail,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Inbox,
  Lock,
} from "lucide-react";

interface StagedOrgData {
  refCode?: string;
  orgName?: string;
  adminEmail?: string;
  planName?: string;
}

export default function SuccessPage() {
  const [data, setData] = useState<StagedOrgData>({
    orgName: "Your Organization",
    adminEmail: "your administrator email",
    planName: "TimeLogic Subscription",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("timelogic_staged_org");
      if (stored) {
        const parsed = JSON.parse(stored);
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: CONFIRMATION & EMAIL INSTRUCTION ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-[#070d1e] border-b border-white/[0.08] bg-grid-pattern">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 space-y-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/20 text-xs font-mono font-medium text-emerald-300">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>WORKSPACE PROVISIONED & ACTIVE</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Subscription & Workspace Activated
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Thank you for subscribing to TimeLogic. Your workspace for{" "}
              <strong className="text-white font-semibold">{data.orgName || "your organization"}</strong> has been confirmed.
            </p>
          </div>

          {/* Notice Card: Open Your Email */}
          <div className="p-7 sm:p-9 rounded-xl bg-[#0b142c] border border-white/[0.08] text-left space-y-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Inbox size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                    Important Next Step
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                    DISPATCH SENT
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Please Open Your Email Inbox For System Credentials
                </h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-lg bg-[#070d1e] border border-white/[0.06] space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                An activation dispatch containing your master login credentials and station pairing token has been sent to:
              </p>
              <div className="p-3 rounded-md bg-[#0b142c] border border-white/[0.08] font-mono text-xs sm:text-sm font-bold text-sky-300 break-all flex items-center gap-2">
                <Mail size={15} className="text-sky-400 flex-shrink-0" />
                <span>{data.adminEmail || "your administrator email"}</span>
              </div>
              <p>
                All your organization details, administrator access credentials, and hardware kiosk pairing instructions are contained in that dispatch.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed bg-blue-950/20 p-3.5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Lock size={13} className="text-sky-400" />
                <span>Security Notice:</span>
              </div>
              <p>
                For organizational privacy, administrator passwords and station tokens are never displayed on this website. Please check your spam folder if the dispatch does not appear in your inbox within 3 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: WHAT TO DO NEXT ── */}
      <section className="py-16 sm:py-20 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
              Next Steps After Opening Your Email
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Follow these three simple onboarding steps:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center font-bold text-xs font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Find Your Email</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open the dispatch titled <em>"Welcome to TimeLogic — Workspace Active & Master Credentials"</em>.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center font-bold text-xs font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Sign In to Dashboard</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log into the TimeLogic administrative portal to configure your shift hours and import your team roster.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-sky-300 flex items-center justify-center font-bold text-xs font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Pair Your Kiosk Station</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your unique station token on your designated office computer or tablet to begin verifying check-ins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ASSISTANCE & RETURN HOME ── */}
      <section className="py-16 sm:py-20 bg-[#070d1e]">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Need Live Assistance or Haven't Received Your Email?
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Our systems architecture and deployment leads are active to immediately verify your workspace status or assist with kiosk hardware pairing.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3.5 flex-wrap">
            <Button
              variant="primary"
              size="md"
              href="https://wa.me/2349113380364"
              icon={<MessageSquare size={14} />}
              className="text-xs sm:text-sm font-semibold shadow-sm"
            >
              Chat with Deployment Lead
            </Button>

            <Button
              variant="outline"
              size="md"
              href="/"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              className="text-xs sm:text-sm text-slate-200 border-white/15 hover:bg-white/10"
            >
              Return to Overview
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
