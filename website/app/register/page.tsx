"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrgRegistrationForm, PlanType } from "@/components/OrgRegistrationForm";
import { PhoneCall, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

function RegisterContent() {
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan")?.toLowerCase();

  let initialPlan: PlanType = "enterprise";
  if (rawPlan === "starter") initialPlan = "starter";
  else if (rawPlan === "organisation" || rawPlan === "organization") initialPlan = "organisation";
  else if (rawPlan === "enterprise") initialPlan = "enterprise";

  return (
    <div className="max-w-4xl mx-auto">
      <OrgRegistrationForm initialPlan={initialPlan} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* Header */}
      <Header />

      {/* ── SECTION 1: HEADER & INTRO (WHITE BG) ── */}
      <section className="pt-16 sm:pt-20 pb-14 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Building2 size={13} className="text-blue-600" />
            <span>Organisation Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Register Your Organisation on TimeLogic
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Configure your company profile, designate your physical office work hours, create master administrator credentials, and select your monthly capacity plan.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: REGISTRATION FORM (BLUE BG) ── */}
      <section className="py-16 sm:py-24 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <Suspense
            fallback={
              <div className="p-12 text-center text-blue-200 text-sm">
                Loading registration workspace...
              </div>
            }
          >
            <RegisterContent />
          </Suspense>
        </div>
      </section>

      {/* ── SECTION 3: ON-PREMISE ASSISTANCE CTA (WHITE BG) ── */}
      <section className="py-20 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Assisted Deployment Available</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
            Prefer Guided Technical Onboarding?
          </h2>

          <p className="text-slate-600 text-base max-w-lg mx-auto leading-relaxed">
            Our deployment engineers are available to configure your organization, offices, and employee rosters directly over the telephone.
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
