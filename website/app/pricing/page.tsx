"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import {
  Check,
  Minus,
  MessageSquare,
  HelpCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "₦20,000",
      period: "/ month",
      capacity: "Up to 20 Employees",
      billing: "Paid monthly (₦20k/mo)",
      description: "Designed for small commercial offices, studios, and single-location businesses eliminating buddy-punching.",
      features: [
        "Up to 20 active employees",
        "1 Active On-Premise Kiosk Station",
        "Biometric facial & employee PIN verification",
        "Live Executive Presence Dashboard",
        "Standard policy violation alerts",
        "1-Click CSV attendance report exports",
      ],
      ctaText: "Deploy Starter Plan",
      highlighted: false,
    },
    {
      name: "Enterprise",
      price: "₦60,000",
      period: "/ month",
      capacity: "Up to 60 Employees",
      billing: "Paid monthly (₦60k/mo)",
      description: "Built for expanding companies, manufacturing plants, and multi-department teams requiring full operational oversight.",
      features: [
        "Up to 60 active employees",
        "Multi-kiosk terminal support across departments",
        "Automated Fraud Detection & Incident Logging",
        "Granular Break Tracking (Lunch, Prayer, Nursing)",
        "Overstayed break alarms & resolution auditing",
        "Direct Microsoft Excel (.xlsx) payroll export",
        "Departmental punctuality & overtime rankings",
      ],
      ctaText: "Deploy Enterprise Plan",
      highlighted: true,
    },
    {
      name: "Organisation",
      price: "Custom",
      period: "Pricing",
      capacity: "Unlimited Headcount",
      billing: "Custom monthly terms",
      description: "Tailored for large multi-branch corporations, educational institutions, and multi-location enterprises.",
      features: [
        "Unlimited custom employee capacity",
        "Multi-branch & multi-facility kiosk network",
        "Student & Apprentice cohort tracking portal",
        "Custom shift rules & multi-window break policies",
        "Dedicated enterprise account manager & SLA",
        "On-premise hardware setup and staff enrollment",
        "24/7 priority telephone & on-site technical support",
      ],
      ctaText: "Contact for Custom Deployment",
      highlighted: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: "Workforce & Terminal Capacity",
      items: [
        { name: "Included active staff capacity", starter: "20 employees", enterprise: "60 employees", org: "Unlimited" },
        { name: "Active kiosk stations allowed", starter: "1 terminal", enterprise: "Unlimited", org: "Unlimited multi-facility" },
        { name: "Biometric facial & PIN lock", starter: true, enterprise: true, org: true },
        { name: "Server-clock tamper protection", starter: true, enterprise: true, org: true },
      ],
    },
    {
      category: "Break & Policy Enforcement",
      items: [
        { name: "Granular break categorization (Lunch, Prayer, Nursing)", starter: false, enterprise: true, org: true },
        { name: "Live floor break monitor toggle", starter: false, enterprise: true, org: true },
        { name: "Automated break overstay alarms", starter: false, enterprise: true, org: true },
        { name: "HR dispute investigation workflow", starter: false, enterprise: true, org: true },
      ],
    },
    {
      category: "Reporting & Integrations",
      items: [
        { name: "Standard CSV report downloads", starter: true, enterprise: true, org: true },
        { name: "Direct Microsoft Excel (.xlsx) payroll export", starter: false, enterprise: true, org: true },
        { name: "Department punctuality & overtime benchmarking", starter: false, enterprise: true, org: true },
        { name: "Student & Apprentice cohort management", starter: false, enterprise: false, org: true },
      ],
    },
    {
      category: "Service & Deployment",
      items: [
        { name: "Onboarding SLA", starter: "Standard (24h)", enterprise: "Priority (12h)", org: "Dedicated Engineer" },
        { name: "Support channel", starter: "WhatsApp & Email", enterprise: "WhatsApp & Telephone", org: "24/7 Dedicated Account Lead" },
        { name: "On-site setup assistance", starter: "Remote guidance", enterprise: "Remote + Assisted", org: "Full on-premise deployment" },
      ],
    },
  ];

  const faqs = [
    {
      q: "What hardware is required for an Attendance Kiosk Station?",
      a: "TimeLogic runs on standard office hardware. Any modern desktop computer, laptop, or tablet (Windows, Linux, macOS, or Android) with a front-facing camera can be paired as an authorized on-premise kiosk station in under 10 minutes.",
    },
    {
      q: "How does TimeLogic prevent workers from spoofing check-ins?",
      a: "Unlike mobile apps that rely on easily spoofed GPS signals, TimeLogic pairs with your physical office network and hardware terminal. Check-in requires employee PIN authentication paired with biometric facial verification synced directly with the server clock.",
    },
    {
      q: "How are monthly subscriptions activated?",
      a: "Each month upon subscription renewal, an 8-digit single-use activation code is issued for your organization. Entering this code in the TimeLogic Admin portal keeps your organization and paired kiosk stations active for the billing period.",
    },
    {
      q: "Can we upgrade our plan as our headcount expands?",
      a: "Yes. Upgrading from Starter to Enterprise or adding additional employee capacity takes immediate effect without requiring any hardware re-pairing or roster re-enrollment.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-white flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HEADER & INTRO ── */}
      <section className="pt-16 sm:pt-20 pb-16 bg-[#070d1e] border-b border-white/[0.08] bg-grid-pattern">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/60 border border-blue-500/20 text-xs font-mono font-medium text-sky-300">
            Licensing & Deployment
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Transparent Monthly Deployment Plans
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Predictable monthly billing based on verified employee headcount. No proprietary hardware lock-in or per-punch surcharges.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: 3 PRICING CARDS ── */}
      <section className="py-20 sm:py-24 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-7 sm:p-8 flex flex-col justify-between transition-all ${
                  plan.highlighted
                    ? "bg-[#0d1838] border-2 border-blue-500 shadow-xl"
                    : "bg-[#0b142c] border border-white/[0.08]"
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white">
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Price & Headcount */}
                  <div className="mt-5 mb-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </div>
                      {plan.period && (
                        <div className="text-xs sm:text-sm font-medium text-slate-400">
                          {plan.period}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono font-medium text-sky-400 mt-1">
                      {plan.capacity} · {plan.billing}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-3">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2.5 my-6 pt-5 border-t border-white/[0.08]">
                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: WhatsApp & Direct Email Deployment */}
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <Button
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="sm"
                    href={`https://wa.me/2349113380364?text=${encodeURIComponent(`Hello TimeLogic Team, I would like to deploy TimeLogic on the ${plan.name} plan.`)}`}
                    icon={<MessageSquare size={13} />}
                    className={`w-full justify-center text-xs font-semibold ${
                      plan.highlighted
                        ? "shadow-sm"
                        : "text-slate-200 border-white/15 hover:bg-white/10"
                    }`}
                  >
                    Deploy {plan.name} on WhatsApp
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    href={`mailto:deployment@timelogics.tech?subject=TimeLogic%20${encodeURIComponent(plan.name)}%20Deployment%20Inquiry&body=Hello%20TimeLogic%20Deployment%20Team%2C%0A%0AWe%20would%20like%20to%20deploy%20TimeLogic%20(${encodeURIComponent(plan.name)}%20Tier).%0A%0AOrganisation%20Name%3A%20...%0AEstimated%20Employees%3A%20...`}
                    icon={<Mail size={12} />}
                    className="w-full justify-center text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Email Deployment Team
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SIDE-BY-SIDE FEATURE MATRIX TABLE ── */}
      <section className="py-20 sm:py-24 bg-[#070d1e] border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/60 border border-blue-500/20 text-xs font-mono font-medium text-sky-300">
              Detailed Breakdown
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Compare Plan Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Every detail regarding kiosk terminals, break auditing, payroll export formats, and support SLAs.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0b142c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#080d1e] text-slate-300 font-semibold">
                    <th className="py-4 px-5 sm:px-6 w-1/3">Feature</th>
                    <th className="py-4 px-4 text-center w-1/5">Starter</th>
                    <th className="py-4 px-4 text-center w-1/5 bg-blue-950/30 text-sky-400">
                      Enterprise
                    </th>
                    <th className="py-4 px-4 text-center w-1/5">Organisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {comparisonFeatures.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr className="bg-[#080d1e]/80">
                        <td
                          colSpan={4}
                          className="py-2.5 px-5 sm:px-6 font-mono text-[11px] font-bold uppercase tracking-wider text-sky-400"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.items.map((item, iIdx) => (
                        <tr key={iIdx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 sm:px-6 font-medium text-white">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {typeof item.starter === "boolean" ? (
                              item.starter ? (
                                <Check size={16} className="text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="text-slate-600 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs text-slate-300">{item.starter}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center bg-blue-950/20 font-medium text-sky-200">
                            {typeof item.enterprise === "boolean" ? (
                              item.enterprise ? (
                                <Check size={16} className="text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="text-slate-600 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs text-sky-300 font-semibold">{item.enterprise}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {typeof item.org === "boolean" ? (
                              item.org ? (
                                <Check size={16} className="text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="text-slate-600 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs text-slate-300">{item.org}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: OPERATIONAL FAQS ── */}
      <section className="py-20 sm:py-24 bg-[#091124] border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Billing & Deployment Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Technical, licensing, and operational details regarding TimeLogic subscriptions.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-6 rounded-xl bg-[#0b142c] border border-white/[0.08] space-y-2"
              >
                <div className="text-sm sm:text-base font-semibold text-white flex items-start gap-2.5">
                  <HelpCircle size={18} className="text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
