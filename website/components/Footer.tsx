"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Mail, MapPin, ShieldCheck, ArrowUp } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#050814] text-slate-300 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group select-none">
              <Logo size={32} theme="dark" />
              <Wordmark className="text-lg font-bold text-white tracking-tight" />
            </Link>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
              Cryptographically bound on-premise biometric attendance infrastructure.
              Eliminates buddy-punching, unmonitored break leaks, and GPS mock-location spoofing with 1-click verified Excel payroll.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>TimeLogic Central Cluster: All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Platform & Features
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/#features" className="text-slate-300 hover:text-white transition-colors">
                  Facial Anti-Spoofing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-slate-300 hover:text-white transition-colors">
                  Break Overstay Alarms
                </Link>
              </li>
              <li>
                <Link href="/#results" className="text-slate-300 hover:text-white transition-colors">
                  Operational Results & ROI
                </Link>
              </li>
              <li>
                <Link href="/solution" className="text-slate-300 hover:text-white transition-colors">
                  Hardware-Bound Architecture
                </Link>
              </li>
              <li>
                <Link href="/post" className="text-slate-300 hover:text-white transition-colors">
                  Production System UI & Screens
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                  Transparent Monthly Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Organization */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Company
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                  Monthly Plans & Pricing
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-slate-300 hover:text-white transition-colors">
                  Engineering Leadership
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support & Contact */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Direct Inquiries
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://wa.me/2349113380364"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp Lead</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@timelogics.tech"
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail size={13} />
                  <span>hello@timelogics.tech</span>
                </a>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 text-xs pt-1">
                <MapPin size={13} />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Back to Top */}
        <div className="mt-14 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} TimeLogic Systems Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Cryptographically Bound On-Premise Terminals</span>
            </span>

            {/* Back to the Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white text-slate-300 text-xs font-medium transition-all active:scale-95"
            >
              <span>Back to the Top</span>
              <ArrowUp size={12} className="text-cyan-400" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
