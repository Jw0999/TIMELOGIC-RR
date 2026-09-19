"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Mail,
  PhoneCall,
  Lock,
  Building2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";

interface StagedOrgData {
  refCode?: string;
  orgName?: string;
  industry?: string;
  timezone?: string;
  officeName?: string;
  officeAddress?: string;
  openTime?: string;
  closeTime?: string;
  breakMinutes?: number;
  breakStart?: string;
  breakEnd?: string;
  adminName?: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminEmail?: string;
  adminPassword?: string;
  selectedPlan?: string;
  planName?: string;
  amount?: string;
  stagedAt?: string;
}

export default function SuccessPage() {
  const [data, setData] = useState<StagedOrgData>({
    refCode: "TL-ORG-84920",
    orgName: "Apex Manufacturing Ltd",
    industry: "Manufacturing & Factories",
    timezone: "Africa/Lagos (GMT+1)",
    officeName: "Main Office HQ",
    officeAddress: "14 Commercial Ave, Sabo, Yaba, Lagos",
    openTime: "08:00",
    closeTime: "17:00",
    breakMinutes: 60,
    breakStart: "13:00",
    breakEnd: "14:00",
    adminName: "John Adeyemi",
    adminFirstName: "John",
    adminLastName: "Adeyemi",
    adminEmail: "admin@apexmanufacturing.com",
    adminPassword: "Password123#",
    selectedPlan: "enterprise",
    planName: "Enterprise Plan (60 Employees)",
    amount: "₦60,000",
  });

  const [copiedToken, setCopiedToken] = useState(false);

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

  const copyPairingToken = () => {
    if (data.refCode) {
      navigator.clipboard.writeText(data.refCode);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: PAYMENT SUCCESS & GMAIL INSTRUCTION (WHITE BG) ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
          {/* Status Badge & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold tracking-wide">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>PAYMENT CONFIRMED · WORKSPACE PROVISIONED</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Registration & Payment Successful!
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Your TimeLogic organization workspace for <strong>{data.orgName}</strong> is now live on our attendance cloud infrastructure.
            </p>
          </div>

          {/* ── HIGH PRIORITY GMAIL ALERT CARD ── */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-400/60 shadow-lg space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Mail size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Important Action Required
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-200/60 text-blue-900">
                    DISPATCH SENT
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                  Check Your Gmail / Work Inbox Now
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed pt-1">
                  A welcome confirmation has been automatically sent from <strong>TimeLogic</strong> to{" "}
                  <strong className="text-blue-700 font-semibold">{data.adminEmail}</strong>. Your master administrator credentials, login URL, and hardware pairing token are contained in the email.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-blue-200/80">
              <Button
                variant="primary"
                size="md"
                href="https://mail.google.com"
                icon={<ExternalLink size={16} />}
                iconPosition="right"
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
              >
                Open Gmail Inbox
              </Button>

              <Button
                variant="outline"
                size="md"
                href="tel:09036627043"
                icon={<PhoneCall size={15} />}
                className="w-full sm:w-auto justify-center text-slate-800 border-slate-300 hover:bg-white/80 font-semibold"
              >
                Call Deployment Lead: 09036627043
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: AUTHENTIC TIMELOGIC EMAIL PREVIEW WITH ADMIN CREDENTIALS (BLUE BG) ── */}
      <section className="py-20 sm:py-24 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Official Email Record
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Drafted TimeLogic Email Dispatch & Credentials
            </h2>
            <p className="text-sm text-blue-100/75 max-w-xl mx-auto leading-relaxed">
              Below is the exact email record dispatched to <strong>{data.adminEmail}</strong>. You can copy your credentials directly from here.
            </p>
          </div>

          {/* Simulated Enterprise Email Window */}
          <div className="rounded-2xl bg-[#0c1a42] border border-blue-400/30 shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Email Client Header Bar */}
            <div className="px-6 py-4 bg-[#081232] border-b border-blue-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div>
                  <span className="text-blue-300 font-semibold">From:</span>{" "}
                  <span className="text-white font-medium">TimeLogic Dispatch &lt;noreply@timelogic.app&gt;</span>
                </div>
                <div>
                  <span className="text-blue-300 font-semibold">To:</span>{" "}
                  <span className="text-white font-medium">
                    {data.adminName} &lt;{data.adminEmail}&gt;
                  </span>
                </div>
                <div>
                  <span className="text-blue-300 font-semibold">Subject:</span>{" "}
                  <span className="text-sky-300 font-bold">
                    Welcome to TimeLogic — Workspace Active & Master Administrator Credentials
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                  Delivered to Inbox
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 sm:p-10 space-y-8 text-slate-100 text-sm leading-relaxed bg-[#0c1a42]">
              {/* Brand Header */}
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">
                    TL
                  </div>
                  <div>
                    <div className="text-base font-bold text-white tracking-tight">TimeLogic</div>
                    <div className="text-[11px] text-blue-200/70">Enterprise Attendance Infrastructure</div>
                  </div>
                </div>

                <div className="text-xs text-blue-200/70 font-mono">
                  Order Ref: {data.refCode}
                </div>
              </div>

              {/* Salutation & Confirmation */}
              <div className="space-y-3">
                <p className="text-base font-semibold text-white">
                  Dear {data.adminName},
                </p>
                <p className="text-blue-100/90 leading-relaxed">
                  Thank you for subscribing to TimeLogic. Your payment of <strong>{data.amount}/month</strong> for the <strong>{data.planName}</strong> has been confirmed. Your organization workspace <strong>{data.orgName}</strong> is fully active and ready for on-premise hardware kiosk pairing.
                </p>
              </div>

              {/* ── MASTER ADMIN CREDENTIALS BOX ── */}
              <div className="p-6 rounded-xl bg-[#07112d] border border-blue-400/35 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-400/20 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                    <Lock size={15} />
                    <span>Your Master Administrator Access Credentials</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                    CONFIDENTIAL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-blue-300 block mb-0.5">Organization:</span>
                    <strong className="text-white text-sm">{data.orgName}</strong>
                  </div>

                  <div>
                    <span className="text-blue-300 block mb-0.5">Admin Portal URL:</span>
                    <a
                      href="https://timelogic.app/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline font-mono text-sm inline-flex items-center gap-1"
                    >
                      <span>https://timelogic.app/login</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div>
                    <span className="text-blue-300 block mb-0.5">Administrator Email:</span>
                    <strong className="text-white font-mono text-sm">{data.adminEmail}</strong>
                  </div>

                  <div>
                    <span className="text-blue-300 block mb-0.5">Master Password:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {data.adminPassword || "•••••••• (Password configured during registration)"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-blue-300 block mb-0.5">Operating Shift Hours:</span>
                    <span className="text-slate-200 font-mono">
                      {data.openTime} – {data.closeTime} ({data.timezone})
                    </span>
                  </div>

                  <div>
                    <span className="text-blue-300 block mb-0.5">Break Policy Window:</span>
                    <span className="text-slate-200 font-mono">
                      {data.breakStart} – {data.breakEnd} ({data.breakMinutes}m limit)
                    </span>
                  </div>
                </div>

                {/* Pairing Token */}
                <div className="mt-2 pt-3 border-t border-blue-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/40 p-3 rounded-lg">
                  <div>
                    <div className="text-[11px] font-bold text-blue-300 uppercase">
                      Hardware Station Pairing Token:
                    </div>
                    <div className="text-base font-mono font-extrabold text-white tracking-wider">
                      {data.refCode}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyPairingToken}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    {copiedToken ? (
                      <>
                        <Check size={14} className="text-emerald-300" />
                        <span>Copied Token</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Next Steps Checklist */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Immediate Deployment Instructions:
                </div>

                <div className="space-y-2.5 text-xs text-blue-100/85">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-sky-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong>Log in to the Admin Dashboard</strong>: Sign in to your executive command center at{" "}
                      <a href="https://timelogic.app/login" className="text-sky-400 underline">
                        timelogic.app/login
                      </a>{" "}
                      using your credentials above.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-sky-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>Pair Your Attendance Kiosk Station</strong>: Designate any office tablet, laptop, or desktop on your company network and input your station pairing token (<strong>{data.refCode}</strong>).
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-sky-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong>Enroll Facial Biometrics</strong>: Open the kiosk and enroll employee facial templates with the one-time alignment frame to permanently lock identity.
                    </span>
                  </div>
                </div>
              </div>

              {/* Signoff */}
              <div className="border-t border-blue-400/20 pt-5 space-y-1 text-xs text-blue-200/80">
                <p>
                  Need assistance with physical installation or staff roster import? Call our Lead Deployment Engineer directly at{" "}
                  <strong className="text-white">09036627043</strong> or reply directly to this message.
                </p>
                <p className="pt-2 font-semibold text-white">
                  — The TimeLogic Systems Architecture & Technical Deployment Team
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: BOTTOM ASSISTANCE & ACTIONS (WHITE BG) ── */}
      <section className="py-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>24/7 Deployment Hotline</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
            Ready to Configure Your Hardware Station?
          </h2>

          <p className="text-slate-600 text-base max-w-lg mx-auto leading-relaxed">
            Our deployment engineers are active and standing by to guide your team through hardware pairing and biometric roster enrollment.
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
