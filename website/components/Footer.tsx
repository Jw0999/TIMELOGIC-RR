import React from "react";
import Link from "next/link";
import { MessageSquare, Mail, MapPin, ShieldCheck } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#050915] text-slate-300 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Logo size={30} />
              <Wordmark className="text-base sm:text-lg font-bold text-white tracking-tight" />
            </Link>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm">
              Hardware-anchored biometric attendance infrastructure. Designed for enterprises, commercial facilities, hospitals, and educational institutions requiring tamper-proof payroll data.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>TimeLogic Central Cluster: All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Platform & Architecture
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/solution" className="text-slate-300 hover:text-white transition-colors">
                  System Architecture & Solutions
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

          {/* Company & Legal */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Organization
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/team" className="text-slate-300 hover:text-white transition-colors">
                  Engineering & Leadership
                </Link>
              </li>
              <li>
                <Link href="/investors" className="text-slate-300 hover:text-white transition-colors">
                  Investor Relations & Thesis
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support & Inquiries */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Direct Contact
            </div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://wa.me/2349113380364"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>Chat on WhatsApp</span>
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
              <li className="flex items-center gap-1.5 text-slate-400 text-xs pt-0.5">
                <MapPin size={13} />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} TimeLogic Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-sky-400" />
              Cryptographically Bound On-Premise Terminals
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
