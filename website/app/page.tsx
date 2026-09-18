import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  ShieldAlert,
  Fingerprint,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Building,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#08090d] text-white flex flex-col justify-between">
      {/* Top Header */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* ── Operational Workflow Section ── */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-[#0b0d13]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-2xl space-y-3 mb-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Operational Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How TimeLogic eliminates attendance fraud in three steps.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Designed from the ground up to prevent the vulnerabilities inherent in paper sheets, punch cards, and mobile GPS check-in apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-xl bg-[#11141d] border border-white/[0.08] space-y-4">
              <div className="text-xs font-mono font-bold text-blue-400">01 / DEPLOYMENT</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Pair Hardware On-Premise
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Designate any office computer or tablet as an authorized Attendance Kiosk Station. The station is cryptographically bound to your physical network.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                • Locked to server clock · Hardware ID authentication
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-xl bg-[#11141d] border border-white/[0.08] space-y-4">
              <div className="text-xs font-mono font-bold text-blue-400">02 / VERIFICATION</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Employee Facial & PIN Punch
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Staff check in upon arrival using registered employee credentials and biometric facial verification. Check-in takes under 3 seconds per employee.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                • Zero proxy punching · Enforced shift schedule windows
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-xl bg-[#11141d] border border-white/[0.08] space-y-4">
              <div className="text-xs font-mono font-bold text-blue-400">03 / INTELLIGENCE</div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Live Audit & Payroll Export
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Management monitors live floor presence and automated fraud alerts in real time. At month-end, export pristine Excel spreadsheets ready for payroll.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                • Direct Excel/CSV download · Second-accurate audit trail
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Feature Grid with Real Screen Previews ── */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Core System Modules
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Engineered for operational rigor across all departments.
              </h2>
            </div>
            <Button variant="outline" size="md" href="/post" icon={<ArrowRight size={14} />} iconPosition="right">
              View All 8 System Screens
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Kiosk Station */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0e1118] overflow-hidden flex flex-col justify-between">
              <div className="p-7 space-y-3">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Check-In Station Portal
                </div>
                <h3 className="text-xl font-bold text-white">
                  Dedicated On-Premise Touch Kiosk
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Intuitive touch interface for staff check-ins. Tracks shift schedule hours, biometric enrollment counts, and active workforce capacity.
                </p>
              </div>
              <div className="border-t border-white/[0.08] bg-[#090b10] p-4">
                <img
                  src="/screenshots/workforce-checkin.png"
                  alt="Workforce Check-In Kiosk Interface"
                  className="rounded-lg border border-white/10 w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Feature 2: Fraud Alerts Engine */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0e1118] overflow-hidden flex flex-col justify-between">
              <div className="p-7 space-y-3">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Automated Anomaly Detection
                </div>
                <h3 className="text-xl font-bold text-white">
                  Real-Time Policy Violation Auditing
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Continuous audit engine that automatically flags overstayed breaks, suspicious timestamps, and off-network check-in attempts with resolution logs.
                </p>
              </div>
              <div className="border-t border-white/[0.08] bg-[#090b10] p-4">
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

      {/* ── Direct Deployment CTA Section ── */}
      <section className="py-20 bg-[#0b0d13]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            Rapid Deployment Guarantee
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to secure your organization's attendance?
          </h2>

          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Our deployment engineers assist with kiosk hardware pairing, staff enrollment, and admin configuration within 24 hours.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={15} />}
            >
              Call Deployment Lead: 09036627043
            </Button>
            <Button variant="secondary" size="lg" href="/pricing">
              View Monthly Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Structured Footer */}
      <Footer />
    </div>
  );
}
