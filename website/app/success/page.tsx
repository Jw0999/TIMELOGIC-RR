"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Mail,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  Inbox,
  Lock,
} from "lucide-react";

interface StagedOrgData {
  refCode?: string;
  orgName?: string;
  industry?: string;
  timezone?: string;
  officeName?: string;
  officeAddress?: string;
  adminName?: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  selectedPlan?: string;
  planName?: string;
  amount?: string;
}

export default function SuccessPage() {
  const [data, setData] = useState<StagedOrgData>({
    orgName: "Your Organization",
    adminEmail: "your registered administrator email",
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
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: PAYMENT CONFIRMATION & OPEN EMAIL INSTRUCTION (WHITE BG) ── */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 space-y-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold tracking-wide">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>PAYMENT CONFIRMED · WORKSPACE PROVISIONED</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Registration & Payment Successful!
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Thank you for subscribing to TimeLogic. Your workspace for{" "}
              <strong className="text-slate-900 font-semibold">{data.orgName || "your organization"}</strong> has been registered and confirmed.
            </p>
          </div>

          {/* ── PRIMARY NOTICE CARD: OPEN YOUR EMAIL ── */}
          <div className="p-7 sm:p-10 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-400/50 shadow-xl text-left space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Inbox size={26} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Important Notice
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    DISPATCH SENT
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                  Please Open Your Email Inbox For All Information
                </h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white/90 border border-blue-200/80 space-y-3 text-sm text-slate-700 leading-relaxed shadow-sm">
              <p>
                A comprehensive activation email has been automatically dispatched to your administrator email address:
              </p>
              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 font-mono text-xs sm:text-sm font-bold text-blue-900 break-all flex items-center gap-2">
                <Mail size={16} className="text-blue-600 flex-shrink-0" />
                <span>{data.adminEmail || "your registered email"}</span>
              </div>
              <p>
                All your organization details, master administrator login credentials, portal access link, and hardware kiosk pairing token are contained in that email.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-blue-100/40 p-3.5 rounded-xl border border-blue-200/60">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Lock size={14} className="text-blue-600" />
                <span>Security Notice:</span>
              </div>
              <p>
                For data protection and organizational privacy, master administrator passwords and station tokens are never exposed on this website. Please open your mail inbox to access all credentials.
              </p>
              <p className="text-slate-500 pt-1">
                Tip: If you do not see the email within 2 to 3 minutes, please check your Spam or Junk folder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: WHAT TO DO NEXT (BLUE BG) ── */}
      <section className="py-16 sm:py-24 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Onboarding Checklist
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Next Steps After Opening Your Email
            </h2>
            <p className="text-sm text-blue-100/75 max-w-xl mx-auto leading-relaxed">
              Here is what to do once you open your welcome email dispatch from TimeLogic:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0c1a42] border border-blue-400/25 shadow-lg space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-sky-300 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-white">Find Your Email</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Look for the dispatch titled <em>"Welcome to TimeLogic — Workspace Active & Master Administrator Credentials"</em> in your inbox.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1a42] border border-blue-400/25 shadow-lg space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-sky-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-white">Sign In to Dashboard</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Use your master administrator email and temporary password provided in the email to sign in and configure your team roster.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1a42] border border-blue-400/25 shadow-lg space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-sky-300 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-white">Pair Your Kiosk Station</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Enter your unique hardware station pairing token on your dedicated office tablet or kiosk screen to start verifying attendance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ASSISTANCE & RETURN HOME (WHITE BG) ── */}
      <section className="py-16 sm:py-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Dedicated Technical Onboarding</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            Need Live Assistance or Haven't Received Your Email?
          </h2>

          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Our systems architecture and deployment leads are active to immediately verify your workspace status or walk you through station hardware deployment.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={16} />}
              className="shadow-md hover:shadow-lg"
            >
              Call Deployment Lead: 09036627043
            </Button>

            <Button
              variant="outline"
              size="lg"
              href="/"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
              className="text-slate-800 border-slate-300 hover:bg-slate-50"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
