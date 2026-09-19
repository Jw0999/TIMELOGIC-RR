import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  ArrowRight,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between">
      {/* ── SECTION 1: HEADER & HERO (WHITE BG) ── */}
      <Header />
      <Hero />

      {/* ── SECTION 2: OPERATIONAL WORKFLOW (BLUE BG) ── */}
      <section className="py-20 sm:py-28 bg-[#0a1638] text-white border-y border-blue-900/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl space-y-3 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Operational Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How TimeLogic eliminates attendance fraud in three steps.
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed">
              Designed from the ground up to prevent the vulnerabilities inherent in paper sheets, punch cards, and mobile GPS check-in apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-[#0f1f4e] border border-blue-400/20 shadow-lg space-y-4">
              <div className="text-xs font-mono font-bold text-sky-400">01 / DEPLOYMENT</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Pair Hardware On-Premise
              </h3>
              <p className="text-sm text-blue-100/75 leading-relaxed">
                Designate any office computer or tablet as an authorized Attendance Kiosk Station. The station is cryptographically bound to your physical network.
              </p>
              <div className="pt-2 text-xs text-blue-200/60">
                • Locked to server clock · Hardware ID authentication
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-[#0f1f4e] border border-blue-400/20 shadow-lg space-y-4">
              <div className="text-xs font-mono font-bold text-sky-400">02 / VERIFICATION</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Employee Facial & PIN Punch
              </h3>
              <p className="text-sm text-blue-100/75 leading-relaxed">
                Staff check in upon arrival using registered employee credentials and biometric facial verification. Check-in takes under 3 seconds per employee.
              </p>
              <div className="pt-2 text-xs text-blue-200/60">
                • Zero proxy punching · Enforced shift schedule windows
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-[#0f1f4e] border border-blue-400/20 shadow-lg space-y-4">
              <div className="text-xs font-mono font-bold text-sky-400">03 / INTELLIGENCE</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Live Audit & Payroll Export
              </h3>
              <p className="text-sm text-blue-100/75 leading-relaxed">
                Management monitors live floor presence and automated fraud alerts in real time. At month-end, export pristine Excel spreadsheets ready for payroll.
              </p>
              <div className="pt-2 text-xs text-blue-200/60">
                • Direct Excel/CSV download · Second-accurate audit trail
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE MODULES & REAL SCREENS (WHITE BG) ── */}
      <section className="py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Core System Modules
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Engineered for operational rigor across all departments.
              </h2>
            </div>
            <Button
              variant="outline"
              size="md"
              href="/post"
              icon={<ArrowRight size={15} />}
              iconPosition="right"
              className="text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950"
            >
              View All 8 System Screens
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Kiosk Station */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="p-8 space-y-3">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Check-In Station Portal
                </div>
                <h3 className="text-xl font-bold text-slate-950">
                  Dedicated On-Premise Touch Kiosk
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Intuitive touch interface for staff check-ins. Tracks shift schedule hours, biometric enrollment counts, and active workforce capacity.
                </p>
              </div>
              <div className="border-t border-slate-200 bg-slate-900 p-4">
                <img
                  src="/screenshots/workforce-checkin.png"
                  alt="Workforce Check-In Kiosk Interface"
                  className="rounded-lg border border-white/10 w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Feature 2: Fraud Alerts Engine */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="p-8 space-y-3">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Automated Anomaly Detection
                </div>
                <h3 className="text-xl font-bold text-slate-950">
                  Real-Time Policy Violation Auditing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Continuous audit engine that automatically flags overstayed breaks, suspicious timestamps, and off-network check-in attempts with resolution logs.
                </p>
              </div>
              <div className="border-t border-slate-200 bg-slate-900 p-4">
                <img
                  src="/screenshots/fraud-alerts.png"
                  alt="Fraud Alerts and Anomaly Resolution Engine"
                  className="rounded-lg border border-white/10 w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: DEPLOYMENT CTA BANNER (BLUE BG) ── */}
      <section className="py-22 bg-[#0a1638] text-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-sky-300">
            Rapid Deployment Guarantee
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to secure your organization's attendance?
          </h2>

          <p className="text-blue-100/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Our deployment engineers assist with kiosk hardware pairing, staff enrollment, and admin configuration within 24 hours.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
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
              href="/pricing"
              className="text-white border-white/30 hover:bg-white/10"
            >
              View Monthly Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
