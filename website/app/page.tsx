"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  PhoneCall,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#070e24] text-white flex flex-col justify-between">
      {/* ── SECTION 1: HEADER & HERO (BLUE BG LIKE WEB APP) ── */}
      <Header />
      <Hero />

      {/* ── SECTION 2: OPERATIONAL WORKFLOW (WHITE BG) ── */}
      <section className="py-20 sm:py-28 bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl space-y-3 mb-14"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Operational Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              How TimeLogic eliminates attendance fraud in three steps.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Designed from the ground up to prevent the vulnerabilities inherent in paper sheets, punch cards, and mobile GPS check-in apps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm space-y-4"
            >
              <div className="text-xs font-mono font-bold text-blue-600">01 / DEPLOYMENT</div>
              <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                Pair Hardware On-Premise
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Designate any office computer or tablet as an authorized Attendance Kiosk Station. The station is cryptographically bound to your physical network.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-medium">
                • Locked to server clock · Hardware ID authentication
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm space-y-4"
            >
              <div className="text-xs font-mono font-bold text-blue-600">02 / VERIFICATION</div>
              <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                Employee Facial & PIN Punch
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Staff check in upon arrival using registered employee credentials and biometric facial verification. Check-in takes under 3 seconds per employee.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-medium">
                • Zero proxy punching · Enforced shift schedule windows
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm space-y-4"
            >
              <div className="text-xs font-mono font-bold text-blue-600">03 / INTELLIGENCE</div>
              <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                Live Audit & Payroll Export
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Management monitors live floor presence and automated fraud alerts in real time. At month-end, export pristine Excel spreadsheets ready for payroll.
              </p>
              <div className="pt-2 text-xs text-slate-500 font-medium">
                • Direct Excel/CSV download · Second-accurate audit trail
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE MODULES & REAL SCREENS (BLUE BG) ── */}
      <section className="py-20 sm:py-28 bg-[#0a1638] text-white border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Core System Modules
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Engineered for operational rigor across all departments.
              </h2>
            </div>
            <Button
              variant="outline"
              size="md"
              href="/post"
              icon={<ArrowRight size={15} />}
              iconPosition="right"
              className="text-white border-white/25 hover:bg-white/10"
            >
              View All 8 System Screens
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Kiosk Station */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-blue-400/20 bg-[#0e1f4e] overflow-hidden flex flex-col justify-between shadow-xl"
            >
              <div className="p-8 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Check-In Station Portal
                </div>
                <h3 className="text-xl font-bold text-white">
                  Dedicated On-Premise Touch Kiosk
                </h3>
                <p className="text-sm text-blue-100/75 leading-relaxed">
                  Intuitive touch interface for staff check-ins. Tracks shift schedule hours, biometric enrollment counts, and active workforce capacity.
                </p>
              </div>
              <div className="border-t border-blue-400/20 bg-slate-950 p-4">
                <img
                  src="/screenshots/workforce-checkin.png"
                  alt="Workforce Check-In Kiosk Interface"
                  className="rounded-lg border border-white/10 w-full h-auto object-cover"
                />
              </div>
            </motion.div>

            {/* Feature 2: Fraud Alerts Engine */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-blue-400/20 bg-[#0e1f4e] overflow-hidden flex flex-col justify-between shadow-xl"
            >
              <div className="p-8 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Automated Anomaly Detection
                </div>
                <h3 className="text-xl font-bold text-white">
                  Real-Time Policy Violation Auditing
                </h3>
                <p className="text-sm text-blue-100/75 leading-relaxed">
                  Continuous audit engine that automatically flags overstayed breaks, suspicious timestamps, and off-network check-in attempts with resolution logs.
                </p>
              </div>
              <div className="border-t border-blue-400/20 bg-slate-950 p-4">
                <img
                  src="/screenshots/fraud-alerts.png"
                  alt="Fraud Alerts and Anomaly Resolution Engine"
                  className="rounded-lg border border-white/10 w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: DEPLOYMENT CTA BANNER (WHITE BG) ── */}
      <section className="py-22 bg-slate-50 text-slate-900 border-t border-slate-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto px-6 sm:px-8 text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-800">
            Rapid Deployment Guarantee
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Ready to secure your organization's attendance?
          </h2>

          <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Our deployment engineers assist with kiosk hardware pairing, staff enrollment, and admin configuration within 24 hours.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="primary"
              size="lg"
              href="tel:09036627043"
              icon={<PhoneCall size={16} />}
              className="shadow-lg hover:shadow-xl"
            >
              Call Deployment Lead: 09036627043
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/pricing"
              className="text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950"
            >
              View Monthly Plans
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
