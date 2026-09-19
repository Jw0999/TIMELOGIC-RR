import React from "react";
import Link from "next/link";
import { PhoneCall, Mail, MapPin } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-blue-900/50 bg-[#060e22] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Logo size={32} />
              <Wordmark className="text-lg font-bold text-white tracking-tight" />
            </Link>
            <p className="text-blue-100/70 text-sm leading-relaxed max-w-sm">
              Cryptographically verified workforce attendance infrastructure. Built for enterprise teams, factories, clinics, and schools that require uncompromised operational truth.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>TimeLogic Kiosk Cloud Services: All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform & Architecture
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/solution" className="hover:text-white transition-colors">
                  System Architecture & Solutions
                </Link>
              </li>
              <li>
                <Link href="/post" className="hover:text-white transition-colors">
                  Live System Screens & UI
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Monthly Deployment Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Company
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/team" className="hover:text-white transition-colors">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="/investors" className="hover:text-white transition-colors">
                  Investor Relations
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support & Inquiries */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Direct Contact
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="tel:09036627043"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  <PhoneCall size={13} />
                  <span>09036627043</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@timelogic.app"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Mail size={13} />
                  <span>hello@timelogic.app</span>
                </a>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500 text-xs pt-1">
                <MapPin size={13} />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} TimeLogic Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Biometric & Kiosk Attendance Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
