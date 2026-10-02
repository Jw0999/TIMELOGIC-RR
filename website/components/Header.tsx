"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ShieldCheck, MessageSquare } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Product", href: "/#features" },
    { label: "Solutions", href: "/solution" },
    { label: "Pricing", href: "/pricing" },
    { label: "Company", href: "/team" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4 px-4 sm:px-6 transition-all duration-300">
      <div
        className={`max-w-6xl mx-auto rounded-full px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-[#0B0D14]/90 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            : "bg-[#0B0D14]/75 backdrop-blur-lg border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
        }`}
      >
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <Logo size={32} theme="dark" />
          <Wordmark className="text-base sm:text-lg font-bold tracking-tight text-white" />
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 border border-cyan-400/25 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            v2.4
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/[0.12] shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://wa.me/2349113380364"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <MessageSquare size={13} className="text-sky-400" />
            <span>Support</span>
          </a>

          <Link
            href="/pricing"
            className="group relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-200 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-[0.98]"
          >
            <span>Get Started</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/pricing"
            className="sm:hidden inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-full focus:outline-none transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Dropdown */}
      {mobileMenuOpen && (
        <div className="max-w-6xl mx-auto mt-2 rounded-2xl border border-white/[0.12] bg-[#0B0D14]/95 backdrop-blur-2xl p-5 md:hidden space-y-4 shadow-2xl relative z-50">
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2.5">
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://wa.me/2349113380364"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-slate-200 border border-white/10 hover:bg-white/[0.05]"
            >
              <MessageSquare size={14} className="text-sky-400" />
              <span>Chat on WhatsApp (+234 911 338 0364)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
