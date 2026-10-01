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
      capacity: "20 Employees · 1 Terminal",
      billing: "Paid monthly (₦20k/mo)",
      description: "Designed for small commercial offices, studios, and single-location businesses eliminating buddy-punching.",
      features: [
        "Up to 20 active employees",
        "1 Active On-Premise Kiosk Station",
        "Biometric facial & employee PIN verification",
        "Live Executive Presence Dashboard",
        "Granular Break Tracking (Lunch, Prayer, Nursing)",
        "Automated Fraud Detection & Overstay Alarms",
        "Direct Microsoft Excel (.xlsx) & CSV payroll exports",
        "Departmental punctuality & overtime rankings",
      ],
      ctaText: "Deploy Starter Plan",
      highlighted: false,
    },
    {
      name: "Enterprise",
      price: "₦60,000",
      period: "/ month",
      capacity: "Up to 60 Employees · Unlimited Terminals",
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
      capacity: "Unlimited Headcount · Multi-Facility",
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
        { name: "Granular break categorization (Lunch, Prayer, Nursing)", starter: true, enterprise: true, org: true },
        { name: "Live floor break monitor toggle", starter: true, enterprise: true, org: true },
        { name: "Automated break overstay alarms", starter: true, enterprise: true, org: true },
        { name: "HR dispute investigation workflow", starter: true, enterprise: true, org: true },
      ],
    },
    {
      category: "Reporting & Integrations",
      items: [
        { name: "Standard CSV report downloads", starter: true, enterprise: true, org: true },
        { name: "Direct Microsoft Excel (.xlsx) payroll export", starter: true, enterprise: true, org: true },
        { name: "Department punctuality & overtime benchmarking", starter: true, enterprise: true, org: true },
        { name: "Student & Apprentice cohort management", starter: true, enterprise: true, org: true },
      ],
    },
    {
      category: "Service & Deployment",
      items: [
        { name: "Onboarding SLA", starter: "Included (24h)", enterprise: "Priority (12h)", org: "Dedicated SLA" },
        { name: "Support channel", starter: "WhatsApp & Email", enterprise: "WhatsApp & Phone", org: "24/7 Dedicated Lead" },
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
    <div className="min-h-screen w-full theme-page-bg transition-colors flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HEADER & INTRO ── */}
      <section className="pt-16 sm:pt-20 pb-16 theme-page-bg border-b border-theme bg-grid-pattern transition-colors">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/20 text-xs font-mono font-medium text-blue-700 dark:text-sky-300">
            Licensing & Deployment
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold theme-text-primary tracking-tight leading-tight">
            Transparent Monthly Deployment Plans
          </h1>

          <p className="theme-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Predictable monthly billing based on verified employee headcount. No proprietary hardware lock-in or per-punch surcharges.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: 3 PRICING CARDS ── */}
      <section className="py-20 sm:py-24 theme-section-bg border-b border-theme transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-7 sm:p-8 flex flex-col justify-between transition-all shadow-xs ${
                  plan.highlighted
                    ? "theme-card-bg border-2 border-blue-500 ring-2 ring-blue-500/20"
                    : "theme-card-bg border border-theme"
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold theme-text-primary tracking-tight">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Price & Headcount */}
                  <div className="mt-5 mb-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold theme-text-primary tracking-tight">
                        {plan.price}
                      </div>
                      {plan.period && (
                        <div className="text-xs sm:text-sm font-medium theme-text-muted">
                          {plan.period}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono font-semibold text-blue-600 dark:text-sky-400 mt-1">
                      {plan.capacity} · {plan.billing}
                    </div>
                  </div>

                  <p className="text-xs theme-text-secondary leading-relaxed mt-3">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2.5 my-6 pt-5 border-t border-theme">
                    <div className="text-xs font-bold theme-text-primary uppercase tracking-wider mb-2">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs theme-text-secondary">
                        <Check size={14} className="text-blue-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: WhatsApp & Direct Email Deployment */}
                <div className="pt-4 border-t border-theme space-y-2">
                  <Button
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="sm"
                    href={`https://wa.me/2349113380364?text=${encodeURIComponent(`Hello TimeLogic Team, I would like to deploy TimeLogic on the ${plan.name} plan.`)}`}
                    icon={<MessageSquare size={13} />}
                    className={`w-full justify-center text-xs font-semibold ${
                      plan.highlighted
                        ? "shadow-xs"
                        : "theme-text-primary border-theme hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    Deploy {plan.name} on WhatsApp
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    href={`mailto:deployment@timelogics.tech?subject=TimeLogic%20${encodeURIComponent(plan.name)}%20Deployment%20Inquiry&body=Hello%20TimeLogic%20Deployment%20Team%2C%0A%0AWe%20would%20like%20to%20deploy%20TimeLogic%20(${encodeURIComponent(plan.name)}%20Tier).%0A%0AOrganisation%20Name%3A%20...%0AEstimated%20Employees%3A%20...`}
                    icon={<Mail size={12} />}
                    className="w-full justify-center text-[11px] theme-text-muted hover:theme-text-primary"
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
      <section className="py-20 sm:py-24 theme-page-bg border-b border-theme transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/20 text-xs font-mono font-medium text-blue-700 dark:text-sky-300">
              Feature Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold theme-text-primary tracking-tight">
              Compare Plan Capabilities
            </h2>
            <p className="text-xs sm:text-sm theme-text-secondary">
              Starter includes complete biometric, policy, and Excel payroll capabilities for a single dedicated kiosk terminal.
            </p>
          </div>

          <div className="rounded-xl border border-theme theme-card-bg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-theme bg-slate-100 dark:bg-[#080d1e] theme-text-primary font-semibold">
                    <th className="py-4 px-5 sm:px-6 w-1/3">Feature</th>
                    <th className="py-4 px-4 text-center w-1/5 text-blue-600 dark:text-sky-400 font-bold">
                      Starter (1 Terminal)
                    </th>
                    <th className="py-4 px-4 text-center w-1/5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-sky-300 font-bold">
                      Enterprise
                    </th>
                    <th className="py-4 px-4 text-center w-1/5 font-bold">Organisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme theme-text-secondary">
                  {comparisonFeatures.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr className="bg-slate-50 dark:bg-[#080d1e]/80">
                        <td
                          colSpan={4}
                          className="py-2.5 px-5 sm:px-6 font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.items.map((item, iIdx) => (
                        <tr key={iIdx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 sm:px-6 font-medium theme-text-primary">
                            {item.name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium">
                            {typeof item.starter === "boolean" ? (
                              item.starter ? (
                                <Check size={16} className="text-blue-600 dark:text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="theme-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-semibold text-blue-700 dark:text-sky-300">{item.starter}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center bg-blue-50/50 dark:bg-blue-950/20 font-medium">
                            {typeof item.enterprise === "boolean" ? (
                              item.enterprise ? (
                                <Check size={16} className="text-blue-600 dark:text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="theme-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-xs text-blue-700 dark:text-sky-300 font-semibold">{item.enterprise}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {typeof item.org === "boolean" ? (
                              item.org ? (
                                <Check size={16} className="text-blue-600 dark:text-sky-400 mx-auto" />
                              ) : (
                                <Minus size={15} className="theme-text-muted mx-auto" />
                              )
                            ) : (
                              <span className="text-xs theme-text-secondary">{item.org}</span>
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
      <section className="py-20 sm:py-24 theme-section-bg border-b border-theme transition-colors">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold theme-text-primary tracking-tight">
              Frequently Asked Billing & Deployment Questions
            </h2>
            <p className="text-xs sm:text-sm theme-text-secondary">
              Technical, licensing, and operational details regarding TimeLogic subscriptions.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="p-6 rounded-xl theme-card-bg border border-theme space-y-2 shadow-xs"
              >
                <div className="text-sm sm:text-base font-semibold theme-text-primary flex items-start gap-2.5">
                  <HelpCircle size={18} className="text-blue-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs sm:text-sm theme-text-secondary leading-relaxed pl-7">
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
