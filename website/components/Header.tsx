"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PhoneCall, Menu, X } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";

interface HeaderProps {
  onCallClick?: () => void;
}

export function Header({ onCallClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Team", href: "/team" },
    { label: "Solution", href: "/solution" },
    { label: "Post", href: "/post" },
    { label: "Pricing", href: "/pricing" },
    { label: "Investors", href: "/investors" },
  ];

  return (
    <header className="relative z-40 w-full px-6 sm:px-10 lg:px-14 py-5">
      <div className="flex items-center justify-between">
        {/* Left: Brand Logo + Nav Links */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={36} className="transition-transform duration-300 group-hover:scale-105" />
            <Wordmark className="text-xl font-bold tracking-tight" />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[14.5px] font-medium text-white/75 hover:text-white transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Call Now Action (Linked to 09036627043) */}
        <div className="hidden sm:flex items-center">
          <a
            href="tel:09036627043"
            onClick={onCallClick}
            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white bg-indigo-950/70 hover:bg-indigo-900/90 border border-indigo-400/40 shadow-[0_0_18px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.55)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <PhoneCall size={13} className="text-indigo-300 animate-pulse" />
            <span>Call Now</span>
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/80 hover:text-white rounded-lg focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mt-4 p-5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10 flex flex-col gap-4 sm:hidden animate-in fade-in slide-in-from-top-2">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-white/80 hover:text-white py-1"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">Direct Line: 09036627043</span>
            <a
              href="tel:09036627043"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
            >
              <PhoneCall size={13} />
              <span>Call Now</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
